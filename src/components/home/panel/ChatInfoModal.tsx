import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ArrowLeft,
  Users,
  Settings,
  LogOut,
  Bell,
  BellOff,
  Image as ImageIcon,
  Trash2,
  ShieldAlert,
  Trash,
  MessageSquareOff,
} from "lucide-react";
import { avatarOnError } from "../../../constants";
import { deleteChat, clearChat, blockChat } from "../../../services/api";

interface ChatInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  chat: {
    id: number | string;
    name: string;
    avatar?: string;
    isGroup?: boolean;
    isAiBot?: boolean;
  };
}

export default function ChatInfoModal({
  isOpen,
  onClose,
  onDeleted,
  chat,
}: ChatInfoModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(chat.name);
  const [confirmAction, setConfirmAction] = useState<
    null | "delete" | "clear" | "leave" | "block"
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const muted = JSON.parse(localStorage.getItem("sc_muted_chats") || "{}");
    setIsMuted(!!muted[chat.id]);
  }, [isOpen, chat.id]);

  const toggleMute = () => {
    const muted = JSON.parse(localStorage.getItem("sc_muted_chats") || "{}");
    const next = !isMuted;
    if (next) muted[chat.id] = true;
    else delete muted[chat.id];
    localStorage.setItem("sc_muted_chats", JSON.stringify(muted));
    setIsMuted(next);
  };

  const handleAction = async () => {
    if (!confirmAction) return;
    setIsProcessing(true);
    try {
      const id = chat.id.toString();
      if (confirmAction === "delete" || confirmAction === "leave")
        await deleteChat(id);
      else if (confirmAction === "clear") await clearChat(id);
      else if (confirmAction === "block") await blockChat(id);
      setConfirmAction(null);
      onClose();
      onDeleted?.();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-3 sm:p-4 sticky-glass shadow-xs border-b border-[var(--sc-border)] shrink-0">
        <button
          onClick={onClose}
          className="mr-3 text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors border border-gray-200"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-[16px] sm:text-[18px] font-bold text-[var(--sc-text-primary)]">
          {chat.isGroup
            ? "Group Info"
            : chat.isAiBot
              ? "Bot Info"
              : "Contact Info"}
        </h2>
      </div>

      {/* Content */}
      <div className="overflow-y-auto pb-6">
        {/* Profile Section */}
        <div className="flex flex-col items-center pt-8 pb-6 px-6 border-b border-[var(--sc-border)]">
          <div className="relative group mb-4">
            <img
              src={chat.avatar}
              alt={chat.name}
              onError={avatarOnError}
              className="w-24 h-24 rounded-full object-cover"
            />
            {chat.isGroup && (
              <button className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ImageIcon size={24} className="text-white" />
              </button>
            )}
          </div>

          {isEditingName && chat.isGroup ? (
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="flex-1 bg-gray-50 border border-[var(--sc-border)] px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--sc-brand-500)] text-[15px] font-bold text-center"
                autoFocus
              />
              <button
                onClick={() => setIsEditingName(false)}
                className="bg-[var(--sc-brand-600)] text-white px-3 py-2 rounded-lg font-bold text-[13px]"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[20px] text-[var(--sc-text-primary)]">
                {chat.name}
              </h3>
              {chat.isGroup && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-[var(--sc-brand-600)] hover:text-[var(--sc-brand-700)]"
                >
                  <Settings size={16} />
                </button>
              )}
            </div>
          )}

          <p className="text-[14px] text-gray-500 mt-1">
            {chat.isGroup
              ? "3 Members"
              : chat.isAiBot
                ? "Virtual Assistant"
                : "@username"}
          </p>
        </div>

        {/* Actions Menu */}
        <div className="flex flex-col p-3">
          <button
            onClick={toggleMute}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${isMuted ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-600"}`}
            >
              {isMuted ? <BellOff size={18} /> : <Bell size={18} />}
            </div>
            <div className="flex flex-col flex-1">
              <span className="font-bold text-[15px] text-[var(--sc-text-primary)]">
                Mute Notifications
              </span>
              <span className="text-[12px] text-gray-500">
                {isMuted
                  ? "Notifications are paused"
                  : "Receive alerts for new messages"}
              </span>
            </div>
            <div
              className={`w-10 h-6 rounded-full p-1 transition-colors ${isMuted ? "bg-[var(--sc-brand-500)]" : "bg-gray-200"}`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${isMuted ? "translate-x-4" : "translate-x-0"}`}
              />
            </div>
          </button>

          <button
            onClick={() => setConfirmAction("clear")}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
              <MessageSquareOff size={18} />
            </div>
            <div className="flex flex-col flex-1">
              <span className="font-bold text-[15px] text-[var(--sc-text-primary)]">
                Clear Chat
              </span>
              <span className="text-[12px] text-gray-500">
                Remove all messages
              </span>
            </div>
          </button>

          {chat.isGroup && (
            <>
              <div className="h-px bg-[var(--sc-border)] my-2 mx-3"></div>
              <button
                onClick={() => alert("Manage members coming soon")}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={18} />
                </div>
                <span className="font-bold text-[15px] text-[var(--sc-text-primary)]">
                  Manage Members
                </span>
              </button>

              <button
                onClick={() => setConfirmAction("leave")}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 transition-colors w-full text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                  <LogOut size={18} />
                </div>
                <span className="font-bold text-[15px] text-red-600">
                  Leave Group
                </span>
              </button>
            </>
          )}

          {!chat.isGroup && !chat.isAiBot && (
            <>
              <div className="h-px bg-[var(--sc-border)] my-2 mx-3"></div>
              <button
                onClick={() => setConfirmAction("block")}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 transition-colors w-full text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                  <ShieldAlert size={18} />
                </div>
                <span className="font-bold text-[15px] text-red-600">
                  Block & Report
                </span>
              </button>
            </>
          )}

          <button
            onClick={() => setConfirmAction("delete")}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 transition-colors w-full text-left group mt-1"
          >
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 group-hover:bg-red-100 flex items-center justify-center transition-colors">
              <Trash2 size={18} />
            </div>
            <span className="font-bold text-[15px] text-red-600">
              Delete Chat
            </span>
          </button>
        </div>
      </div>

      {confirmAction && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${confirmAction === "delete" || confirmAction === "block" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}
          >
            {confirmAction === "delete" ? (
              <Trash size={24} />
            ) : confirmAction === "block" ? (
              <ShieldAlert size={24} />
            ) : confirmAction === "leave" ? (
              <LogOut size={24} />
            ) : (
              <Trash2 size={24} />
            )}
          </div>
          <h3 className="font-bold text-[16px] text-[var(--sc-text-primary)]">
            {confirmAction === "delete"
              ? "Delete chat?"
              : confirmAction === "clear"
                ? "Clear messages?"
                : confirmAction === "leave"
                  ? "Leave group?"
                  : "Block user?"}
          </h3>
          <p className="text-[13px] text-gray-500 mt-1 max-w-[240px]">
            {confirmAction === "delete"
              ? `This will permanently delete your conversation with ${chat.name}.`
              : confirmAction === "clear"
                ? "All messages will be removed but the chat will remain."
                : confirmAction === "leave"
                  ? "You will be removed from the group."
                  : `You won’t receive messages from ${chat.name} again.`}
          </p>
          <div className="flex gap-3 mt-6 w-full">
            <button
              disabled={isProcessing}
              onClick={() => setConfirmAction(null)}
              className="flex-1 py-2.5 rounded-xl border border-[var(--sc-border)] font-bold text-[14px] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              disabled={isProcessing}
              onClick={handleAction}
              className={`flex-1 py-2.5 rounded-xl font-bold text-[14px] text-white disabled:opacity-50 ${confirmAction === "delete" || confirmAction === "block" ? "bg-red-600 hover:bg-red-700" : "bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)]"}`}
            >
              {isProcessing ? "..." : "Confirm"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
