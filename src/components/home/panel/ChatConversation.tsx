import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Info, Send, Paperclip, Smile, X, User, WifiOff, Zap } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import ChatBubble from "./ChatBubble";
import type { Message } from "./ChatBubble";
import ChatInfoModal from "./ChatInfoModal";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchMessages, sendMessage } from "../../../services/api";
import { presenceText } from "../../../utils/presence";
import { getStoredPreferences } from "../../../services/preferences";
import {
  generateOfflineTriageStream,
  getWebLLMStatus,
} from "../../../services/webllm.service";

interface ChatConversationProps {
  chat: {
    id: number | string;
    name: string;
    avatar?: string;
    isGroup?: boolean;
    isAiBot?: boolean;
    lastSeenAt?: string | null;
  };
  onBack: () => void;
  onChatDeleted?: (id: string) => void;
}

const AI_BOT_AVATAR = "/aivetbot.svg";
const BOT_TYPING_SAFETY_MS = 120000;

export default function ChatConversation({
  chat,
  onBack,
  onChatDeleted,
}: ChatConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // ── Offline / WebLLM state ──────────────────────────────────────────────
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineGenError, setOfflineGenError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botRepliesAtSendRef = useRef<number>(0);
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(tick);
  }, []);

  // ── Network online / offline listener ──────────────────────────────────
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const botAvatar = chat.avatar || AI_BOT_AVATAR;
  const isAi = chat.isAiBot;
  const presence = presenceText(isAi ? null : chat.lastSeenAt, now);

  const dayLabel = (date: Date): string => {
    if (isNaN(date.getTime())) return "";
    const nowD = new Date();
    if (date.toDateString() === nowD.toDateString()) return "Today";
    const yesterday = new Date();
    yesterday.setDate(nowD.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: date.getFullYear() === nowD.getFullYear() ? undefined : "numeric",
    });
  };

  const formatMessages = useCallback(
    (data: any[]) =>
      data.map((m: any) => {
        const date = new Date(m.createdAt);
        const timeString = isNaN(date.getTime())
          ? ""
          : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return {
          id: m.id,
          senderId: m.senderId === user?.uid ? "me" : "other",
          senderName: m.sender?.displayName || chat.name,
          senderAvatar: botAvatar,
          content: m.content,
          imageUrl: m.imageUrl,
          timestamp: timeString,
          day: dayLabel(date),
          isMine: m.senderId === user?.uid,
          status: "read" as const,
        };
      }),
    [user?.uid, chat.name, botAvatar],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target as Node)
      ) {
        setIsEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear typing state on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Load and poll messages — skip network poll when offline + AI bot
  useEffect(() => {
    if (!user) return;
    if (isOffline && chat.isAiBot) return; // local-only when offline

    const loadMsgs = async () => {
      try {
        const data = await fetchMessages(user.uid, chat.id.toString());
        const formatted = formatMessages(data);

        setMessages(formatted);

        // Only clear the typing indicator when a NEW bot message arrives
        // (past the count that existed when the user sent)
        if (chat.isAiBot) {
          const botCount = formatted.filter((m) => !m.isMine).length;
          if (botCount > botRepliesAtSendRef.current) {
            setIsBotTyping(false);
            if (typingTimeoutRef.current)
              clearTimeout(typingTimeoutRef.current);
          }
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    loadMsgs();
    const interval = setInterval(loadMsgs, 3000);
    return () => clearInterval(interval);
  }, [user, chat.id, chat.name, chat.isAiBot, formatMessages, isOffline]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Offline triage via WebLLM with streaming ───────────────────────────
  const handleOfflineSend = async (text: string) => {
    if (!text.trim()) return;
    setOfflineGenError(null);

    const nowTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const today = dayLabel(new Date());

    const userMsg: Message = {
      id: `local-${Date.now()}-user`,
      senderId: "me",
      senderName: "You",
      senderAvatar: "",
      content: text,
      timestamp: nowTime,
      day: today,
      isMine: true,
      status: "read",
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsBotTyping(true);

    // Insert a streaming placeholder bot message
    const botMsgId = `local-${Date.now()}-bot`;
    const botMsgBase: Message = {
      id: botMsgId,
      senderId: "other",
      senderName: chat.name,
      senderAvatar: botAvatar,
      content: "",
      timestamp: nowTime,
      day: today,
      isMine: false,
      status: "read",
    };
    // Add empty placeholder so the bubble appears immediately
    setMessages((prev) => [...prev, botMsgBase]);
    setIsBotTyping(false);

    try {
      const history = messages
        .slice(-12)
        .map((m) => ({ role: m.isMine ? "user" : "assistant", content: m.content || "" }));
      history.push({ role: "user", content: text });

      await generateOfflineTriageStream(history, (_token, accumulated) => {
        // Update the placeholder bubble with streamed content
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId ? { ...m, content: accumulated } : m,
          ),
        );
      });
    } catch (err: any) {
      // Remove placeholder on error
      setMessages((prev) => prev.filter((m) => m.id !== botMsgId));
      setOfflineGenError(
        err?.message?.includes("fetch") || err?.message?.includes("network")
          ? "Model needs internet to initialize for the first time. Download it while online in Settings."
          : err?.message || "Offline inference failed.",
      );
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !user) return;

    const tempText = inputValue;
    setInputValue("");
    setIsEmojiOpen(false);

    // Sync React offline state with actual network state (navigator.onLine is advisory only)
    const actuallyOffline = !navigator.onLine;
    if (actuallyOffline && !isOffline) setIsOffline(true);

    // ── Pre-emptive offline route when navigator.onLine is definitively false ──
    if (chat.isAiBot && actuallyOffline) {
      const prefs = getStoredPreferences();
      if (prefs.useOfflineTriage) {
        const webllmStatus = getWebLLMStatus();
        if (webllmStatus.status === "ready" || webllmStatus.isCached) {
          await handleOfflineSend(tempText);
        } else {
          setOfflineGenError(
            "Anvil-2-PAW model is not yet loaded. Go to Settings \u2192 Experimental to download it first.",
          );
          setInputValue(tempText);
        }
      } else {
        setOfflineGenError(
          "You are offline. Enable Anvil-2-PAW in Settings \u2192 Experimental to triage without internet.",
        );
        setInputValue(tempText);
      }
      return;
    }

    // ── Standard NIM cloud path ─────────────────────────────────────────
    if (chat.isAiBot) {
      botRepliesAtSendRef.current = messages.filter((m) => !m.isMine).length;
      setIsBotTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(
        () => setIsBotTyping(false),
        BOT_TYPING_SAFETY_MS,
      );
    }

    try {
      await sendMessage(chat.id.toString(), tempText);
      setSendError(null);
      const data = await fetchMessages(user.uid, chat.id.toString());
      setMessages(formatMessages(data));
    } catch (err) {
      // ── Auto-fallback to WebLLM on ANY network failure for the AI bot ──
      // navigator.onLine is unreliable (true on LAN-with-no-internet), so we
      // gate on whether the request actually failed, not on the online flag.
      if (chat.isAiBot) {
        const prefs = getStoredPreferences();
        const webllmStatus = getWebLLMStatus();
        if (
          prefs.useOfflineTriage &&
          (webllmStatus.status === "ready" || webllmStatus.isCached)
        ) {
          // Silently switch to offline mode — do NOT setIsOffline so online
          // event can still recover naturally via the browser listener
          setIsBotTyping(false);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          await handleOfflineSend(tempText);
          return;
        }
      }

      console.error("Failed to send message:", err);
      setSendError(
        err instanceof Error
          ? err.message
          : "Failed to send message. Please try again.",
      );
      setInputValue(tempText);
      if (chat.isAiBot) {
        setIsBotTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Show typing indicator while the bot processes the image
        if (chat.isAiBot) {
          botRepliesAtSendRef.current = messages.filter(
            (m) => !m.isMine,
          ).length;
          setIsBotTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(
            () => setIsBotTyping(false),
            BOT_TYPING_SAFETY_MS,
          );
        }
        try {
          await sendMessage(
            chat.id.toString(),
            "📷 Sent an image",
            base64String,
          );
          // Immediately fetch new messages
          const data = await fetchMessages(user.uid, chat.id.toString());
          setMessages(formatMessages(data));
          if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err) {
          console.error("Failed to send image:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Offline banner state
  const prefs = getStoredPreferences();
  const showOfflineBanner = isAi && isOffline;
  const offlineReady =
    showOfflineBanner &&
    prefs.useOfflineTriage &&
    (getWebLLMStatus().status === "ready" || getWebLLMStatus().isCached);
  const offlineEnabled =
    showOfflineBanner && prefs.useOfflineTriage && !offlineReady;
  const offlineDisabled = showOfflineBanner && !prefs.useOfflineTriage;

  return (
    <div className="flex flex-col h-full bg-white relative rounded-2xl">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 border-b border-[var(--sc-border)] glass-effect z-10 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setIsInfoOpen(true)}
          >
            {isAi ? (
              <div className="w-9 h-9 rounded-full bg-[var(--sc-brand-50)] border border-[var(--sc-brand-200)] flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-2xs">
                <img
                  src={botAvatar}
                  alt={chat.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : chat.avatar ? (
              <img
                src={botAvatar}
                alt={chat.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={18} className="text-gray-400" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-[15px] text-[var(--sc-text-primary)] leading-tight">
                {chat.name}
              </span>
              <span
                className={`text-[12px] font-medium leading-tight ${
                  isAi
                    ? isOffline
                      ? "text-amber-500"
                      : "text-gray-500"
                    : presence.online
                      ? "text-green-500"
                      : "text-gray-400"
                }`}
              >
                {isAi
                  ? isOffline
                    ? offlineReady
                      ? "\u26a1 Anvil-2-PAW Active"
                      : "Offline"
                    : "Always available"
                  : presence.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsInfoOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* ── Offline Mode Banner ─────────────────────────────────────────── */}
      {showOfflineBanner && (
        <div
          className={`absolute top-[73px] left-0 right-0 z-10 px-4 py-2 flex items-center gap-2 text-[12px] font-semibold ${
            offlineReady
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
              : offlineEnabled
                ? "bg-amber-50 border-b border-amber-200 text-amber-700"
                : "bg-gray-50 border-b border-gray-200 text-gray-500"
          }`}
        >
          {offlineReady ? (
            <>
              <Zap size={13} className="shrink-0" />
              <span>
                Offline Mode — Anvil-2-PAW in-browser AI is active. Responses run entirely on your device.
              </span>
            </>
          ) : offlineEnabled ? (
            <>
              <WifiOff size={13} className="shrink-0" />
              <span>
                You are offline. Anvil-2-PAW is enabled but not yet loaded.
                Open Settings → Experimental to finish downloading.
              </span>
            </>
          ) : (
            <>
              <WifiOff size={13} className="shrink-0" />
              <span>
                You are offline. Enable{" "}
                <strong>Offline AI Vet Triage (Anvil-2-PAW)</strong> in
                Settings → Experimental to triage without internet.
              </span>
            </>
          )}
        </div>
      )}

      {/* Message List */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto p-4 flex flex-col gap-1 bg-[#f8f9fa] ${showOfflineBanner ? "pt-28" : "pt-20"}`}
      >
        {messages.map((msg, index) => {
          // Day divider before the first message of each day
          const prevMsg = messages[index - 1];
          const showDayDivider = msg.day && msg.day !== prevMsg?.day;
          // Show avatar only for the last message in a consecutive block from the same non-me sender
          const nextMsg = messages[index + 1];
          const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
          const showAvatar = !msg.isMine && isLastInGroup;

          return (
            <div key={msg.id}>
              {showDayDivider && (
                <div className="text-center my-4">
                  <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full ">
                    {msg.day}
                  </span>
                </div>
              )}
              <ChatBubble
                message={{ ...msg, senderAvatar: botAvatar }}
                showAvatar={showAvatar}
                isBot={chat.isAiBot && !msg.isMine}
              />
            </div>
          );
        })}

        {isBotTyping && (
          <div className="flex w-full justify-start mb-4">
            <div className="mr-2 flex-shrink-0 flex items-end">
              <div className="w-8 h-8 rounded-full bg-[var(--sc-brand-50)] border border-[var(--sc-brand-200)] flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs">
                <img
                  src={botAvatar}
                  alt="AI Vet Assistant"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[12px] font-bold text-gray-500 mb-1 ml-1">
                {offlineReady ? "Anvil-2-PAW" : "AI Vet Assistant"}
              </span>
              <div className="bg-[var(--sc-brand-50)] border border-[var(--sc-brand-200)] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[var(--sc-brand-400)] animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[var(--sc-brand-400)] animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[var(--sc-brand-400)] animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8 text-sm">
            Say hi to {chat.name}!
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-[var(--sc-border)] shrink-0 rounded-b-2xl relative">
        {(sendError || offlineGenError) && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-medium flex items-center gap-2">
            <span className="flex-1">{sendError || offlineGenError}</span>
            <button
              onClick={() => { setSendError(null); setOfflineGenError(null); }}
              className="text-red-400 hover:text-red-600 transition-colors shrink-0"
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* Render emoji picker outside the text input container so it doesn't get squished */}
        {isEmojiOpen && (
          <div
            ref={emojiRef}
            className="absolute bottom-[80px] right-4 z-50 shadow-xl rounded-xl"
          >
            <EmojiPicker
              height={350}
              width={280}
              onEmojiClick={(e) => setInputValue((prev) => prev + e.emoji)}
            />
          </div>
        )}

        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-[var(--sc-border)] p-1 focus-within:border-[var(--sc-brand-400)] focus-within:ring-4 focus-within:ring-[var(--sc-brand-100)] transition-all relative">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-400 hover:text-[var(--sc-brand-500)] transition-colors shrink-0"
          >
            <Paperclip size={20} />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={offlineReady ? "Describe the animal's symptoms..." : "Type a message..."}
            className="flex-1 min-w-0 bg-transparent py-3 px-2 text-[15px] focus:outline-none focus:ring-0 border-none ring-0 outline-none"
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEmojiOpen(!isEmojiOpen);
            }}
            className={`p-2.5 transition-colors shrink-0 ${isEmojiOpen ? "text-[var(--sc-brand-500)]" : "text-gray-400 hover:text-[var(--sc-brand-500)]"}`}
          >
            <Smile size={20} />
          </button>

          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              inputValue.trim()
                ? offlineReady
                  ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:opacity-90"
                  : "bg-[var(--sc-brand-600)] text-white hover:bg-[var(--sc-brand-700)]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Send size={18} className={inputValue.trim() ? "ml-0.5" : ""} />
          </button>
        </div>

        {/* Offline mode footer label */}
        {offlineReady && (
          <p className="text-center text-[11px] text-violet-500 font-semibold mt-1.5 flex items-center justify-center gap-1">
            <Zap size={10} />
            Running on-device via Anvil-2-PAW WebLLM
          </p>
        )}
        {offlineDisabled && (
          <p className="text-center text-[11px] text-gray-400 mt-1.5">
            Enable offline AI in Settings → Experimental
          </p>
        )}
      </div>

      <ChatInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        chat={chat}
        onDeleted={() => {
          onChatDeleted?.(chat.id.toString());
          onBack();
        }}
      />
    </div>
  );
}
