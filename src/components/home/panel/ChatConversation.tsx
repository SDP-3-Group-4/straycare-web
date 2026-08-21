import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Info, Send, Paperclip, Smile, X, User } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import ChatBubble from './ChatBubble';
import type { Message } from './ChatBubble';
import ChatInfoModal from './ChatInfoModal';
import { useAuth } from '../../../contexts/AuthContext';
import { fetchMessages, sendMessage } from '../../../services/api';
import { presenceText } from '../../../utils/presence';

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

const AI_BOT_AVATAR = "data:image/png;base64,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";
const BOT_TYPING_SAFETY_MS = 120000;

export default function ChatConversation({ chat, onBack, onChatDeleted }: ChatConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  
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

  const botAvatar = chat.avatar || AI_BOT_AVATAR;
  const isAi = chat.isAiBot;
  const presence = presenceText(isAi ? null : chat.lastSeenAt, now);

  const dayLabel = (date: Date): string => {
    if (isNaN(date.getTime())) return '';
    const nowD = new Date();
    if (date.toDateString() === nowD.toDateString()) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(nowD.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() === nowD.getFullYear() ? undefined : 'numeric' });
  };

  const formatMessages = useCallback((data: any[]) => data.map((m: any) => {
      const date = new Date(m.createdAt);
      const timeString = isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        id: m.id,
        senderId: m.senderId === user?.uid ? 'me' : 'other',
        senderName: m.sender?.displayName || chat.name,
        senderAvatar: botAvatar,
        content: m.content,
        imageUrl: m.imageUrl,
        timestamp: timeString,
        day: dayLabel(date),
        isMine: m.senderId === user?.uid,
        status: 'read' as const
      };
    }), [user?.uid, chat.name, botAvatar]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
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

  // Load and poll messages
  useEffect(() => {
    if (!user) return;

    const loadMsgs = async () => {
      try {
        const data = await fetchMessages(user.uid, chat.id.toString());
        const formatted = formatMessages(data);
        
        setMessages(formatted);

        // Only clear the typing indicator when a NEW bot message arrives
        // (past the count that existed when the user sent)
        if (chat.isAiBot) {
          const botCount = formatted.filter(m => !m.isMine).length;
          if (botCount > botRepliesAtSendRef.current) {
            setIsBotTyping(false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          }
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    loadMsgs();
    const interval = setInterval(loadMsgs, 3000);
    return () => clearInterval(interval);
  }, [user, chat.id, chat.name, chat.isAiBot, formatMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !user) return;
    
    const tempText = inputValue;
    setInputValue('');
    setIsEmojiOpen(false);

    // Show the typing indicator until the AI reply arrives (safety fallback only)
    if (chat.isAiBot) {
      botRepliesAtSendRef.current = messages.filter(m => !m.isMine).length;
      setIsBotTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsBotTyping(false), BOT_TYPING_SAFETY_MS);
    }
    
    try {
      await sendMessage(chat.id.toString(), tempText);
      setSendError(null);
      // Immediately fetch new messages
      const data = await fetchMessages(user.uid, chat.id.toString());
      setMessages(formatMessages(data));
    } catch (err) {
      console.error("Failed to send message:", err);
      setSendError(err instanceof Error ? err.message : "Failed to send message. Please try again.");
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
          botRepliesAtSendRef.current = messages.filter(m => !m.isMine).length;
          setIsBotTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsBotTyping(false), BOT_TYPING_SAFETY_MS);
        }
        try {
          await sendMessage(chat.id.toString(), "📷 Sent an image", base64String);
          // Immediately fetch new messages
          const data = await fetchMessages(user.uid, chat.id.toString());
          setMessages(formatMessages(data));
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
          console.error("Failed to send image:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--sc-border)] bg-white sticky top-0 z-10 shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsInfoOpen(true)}>
            {isAi || chat.avatar ? (
              <img src={botAvatar} alt={chat.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={18} className="text-gray-400" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-[15px] text-[var(--sc-text-primary)] leading-tight">{chat.name}</span>
              <span className={`text-[12px] font-medium leading-tight ${isAi ? 'text-gray-500' : presence.online ? 'text-green-500' : 'text-gray-400'}`}>
                {isAi ? 'Always available' : presence.label}
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

      {/* Message List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 bg-[#f8f9fa]"
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
                    <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      {msg.day}
                    </span>
                  </div>
                )}
                <ChatBubble 
                  message={{...msg, senderAvatar: botAvatar}} 
                  showAvatar={showAvatar} 
                  isBot={chat.isAiBot && !msg.isMine}
                />
              </div>
            );
          })}
        
        {isBotTyping && (
          <div className="flex w-full justify-start mb-4">
            <div className="mr-2 flex-shrink-0 flex items-end">
              <img src={botAvatar} alt="AI Vet Assistant" className="w-8 h-8 rounded-full object-cover" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[12px] font-bold text-gray-500 mb-1 ml-1">AI Vet Assistant</span>
              <div className="bg-[var(--sc-brand-50)] border border-[var(--sc-brand-200)] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--sc-brand-400)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--sc-brand-400)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--sc-brand-400)] animate-bounce" style={{ animationDelay: '300ms' }} />
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
        {sendError && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-medium flex items-center gap-2">
            <span className="flex-1">{sendError}</span>
            <button onClick={() => setSendError(null)} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* Render emoji picker outside the text input container so it doesn't get squished */}
        {isEmojiOpen && (
          <div ref={emojiRef} className="absolute bottom-[80px] right-4 z-50 shadow-xl rounded-xl">
            <EmojiPicker height={350} width={280} onEmojiClick={(e) => setInputValue(prev => prev + e.emoji)} />
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
            placeholder="Type a message..."
            className="flex-1 min-w-0 bg-transparent py-3 px-2 text-[15px] focus:outline-none focus:ring-0 border-none ring-0 outline-none"
          />
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsEmojiOpen(!isEmojiOpen);
            }}
            className={`p-2.5 transition-colors shrink-0 ${isEmojiOpen ? 'text-[var(--sc-brand-500)]' : 'text-gray-400 hover:text-[var(--sc-brand-500)]'}`}
          >
            <Smile size={20} />
          </button>
          
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              inputValue.trim() 
                ? 'bg-[var(--sc-brand-600)] text-white hover:bg-[var(--sc-brand-700)]' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={18} className={inputValue.trim() ? "ml-0.5" : ""} />
          </button>
        </div>
      </div>

      <ChatInfoModal 
        isOpen={isInfoOpen} 
        onClose={() => setIsInfoOpen(false)} 
        chat={chat}
        onDeleted={() => { onChatDeleted?.(chat.id.toString()); onBack(); }}
      />
    </div>
  );
}
