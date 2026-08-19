import { useState, useEffect } from "react";
import { Bot, MessageSquare, ChevronUp, ChevronDown, Plus, ChevronRight, Sparkles, User } from "lucide-react";
import ChatConversation from "./ChatConversation";
import NewChatModal from "./NewChatModal";
import { avatarOnError } from "../../../constants";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchChats, createChat } from "../../../services/api";
import { presenceText } from "../../../utils/presence";

export type Chat = {
  id: string;
  name: string;
  message: string;
  time: string;
  unread: number;
  avatar: string;
  isGroup?: boolean;
  isAiBot?: boolean;
  lastSeenAt?: string | null;
};

const AI_BOT_AVATAR = "data:image/png;base64,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";

export default function ChatWidget() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [now, setNow] = useState(Date.now());
  const { user } = useAuth();

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadChats = async () => {
      try {
        const data = await fetchChats(user.uid);
        const now = new Date();
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);

        const formattedChats = data.map((c: any) => {
          const date = new Date(c.latestMessageTime);
          let timeString = '';
          if (!isNaN(date.getTime())) {
            if (date.toDateString() === now.toDateString()) {
              timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (date.toDateString() === yesterday.toDateString()) {
              timeString = 'Yesterday';
            } else {
              timeString = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
          }
          return {
            id: c.id,
            name: c.name || "Unknown User",
            message: c.latestMessage || "No messages yet.",
            time: timeString,
            unread: c.unread,
            avatar: c.avatar || '',
            isGroup: c.isGroup,
            isAiBot: c.otherUserId === 'ai-vet-bot-id',
            lastSeenAt: c.otherLastSeenAt || null,
          };
        });
        setChats(formattedChats);
      } catch (err) {
        console.error("Failed to load chats:", err);
      }
    };

    loadChats();
    const interval = setInterval(loadChats, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [user]);

  // If a chat is active, render the ChatConversation view directly inside this widget
  if (activeChat) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--sc-border)] flex flex-col flex-1 min-h-0 max-h-[800px] relative z-10">
        <ChatConversation 
          chat={activeChat} 
          onBack={() => setActiveChat(null)} 
        />
      </div>
    );
  }

  const humanChats = chats.filter((chat) => !chat.isAiBot);
  const totalUnread = humanChats.reduce((acc, chat) => acc + chat.unread, 0);

  // Otherwise, render the Chat List view
  return (
    <>
      <div className={`bg-white rounded-2xl border border-[var(--sc-border)] flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-auto flex-none' : 'flex-1 min-h-0 max-h-[800px]'}`}>
        {/* Header */}
        <div 
          className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[var(--sc-text-primary)] text-xl">Messages</h3>
            {totalUnread > 0 && (
              <span className="bg-[var(--sc-brand-100)] text-[var(--sc-brand-600)] text-[11px] font-bold px-2 py-0.5 rounded-full">
                {totalUnread} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsNewChatOpen(true); }}
              className="text-gray-400 hover:text-[var(--sc-brand-500)] transition-colors p-1"
            >
              <Plus size={20} />
            </button>
            <button className="text-gray-400 hover:text-[var(--sc-brand-500)] transition-colors p-1">
              {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* AI Vet Bot Banner */}
            <div className="px-5 mb-4">
              <button 
                onClick={async () => {
                  try {
                    if (!user) return;
                    const conv = await createChat(user.uid, 'ai-vet-bot-id');
                    setActiveChat({
                      id: conv.id,
                      name: 'AI Vet Assistant',
                      message: '',
                      time: '',
                      unread: 0,
                      avatar: AI_BOT_AVATAR,
                      isAiBot: true
                    });
                  } catch (e) {
                    console.error("Failed to start AI chat", e);
                  }
                }}
                className="w-full relative overflow-hidden bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] rounded-2xl p-4 flex items-center gap-4 text-white transition-all duration-300 group shadow-lg shadow-[var(--sc-brand-200)]"
              >
                <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                <div className="absolute -left-4 -bottom-10 w-20 h-20 bg-[var(--sc-brand-300)]/20 rounded-full blur-xl" />
                <div className="relative bg-white/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/25">
                  <Bot size={22} className="text-white" />
                </div>
                <div className="relative flex flex-col text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[15px] tracking-tight whitespace-nowrap">AI Vet Assistant</span>
                    <span className="bg-white text-[var(--sc-brand-600)] text-[9px] font-extrabold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full shadow-sm">
                      Beta
                    </span>
                  </div>
                  <span className="text-xs text-white/90 mt-0.5">Instant vet advice, anytime</span>
                </div>
                <div className="relative flex items-center gap-1 text-white/70 group-hover:text-white transition-colors">
                  <Sparkles size={15} className="group-hover:rotate-12 transition-transform" />
                  <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>

            {/* Chat List */}
            <div className="flex flex-col px-3 pb-2 overflow-y-auto flex-1">
              {humanChats.map((chat) => (
                <button 
                  key={chat.id} 
                  onClick={() => setActiveChat(chat)}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left w-full mb-1"
                >
                  <div className="relative flex-shrink-0">
                    {chat.avatar && !chat.isAiBot ? (
                      <img src={chat.avatar} alt={chat.name} onError={avatarOnError} className="w-10 h-10 rounded-full object-cover" />
                    ) : chat.isAiBot ? (
                      <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={20} className="text-gray-400" />
                      </div>
                    )}
                    {chat.unread > 0 && (
                      <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-[var(--sc-text-primary)] text-[14px] truncate">{chat.name}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-gray-400 text-[12px]">{chat.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[13px] truncate ${chat.unread > 0 ? 'text-[var(--sc-text-primary)] font-semibold' : 'text-gray-500'}`}>
                        {chat.message}
                      </span>
                      <span className={`flex items-center gap-1 text-[11px] font-medium shrink-0 ${presenceText(chat.lastSeenAt, now).online ? 'text-green-500' : 'text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${presenceText(chat.lastSeenAt, now).online ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {presenceText(chat.lastSeenAt, now).label}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
              {humanChats.length === 0 && (
                <div className="text-center text-gray-400 py-8 text-sm">
                  No conversations yet.
                </div>
              )}
            </div>
            
            {/* Start new chat */}
            <div className="mt-auto px-5 pb-5 pt-3 border-t border-gray-50 shrink-0">
              <button 
                onClick={() => setIsNewChatOpen(true)}
                className="w-full py-3 text-center text-[15px] font-bold text-[var(--sc-brand-500)] bg-[var(--sc-brand-50)] hover:bg-[var(--sc-brand-100)] rounded-xl transition-colors flex items-center justify-center gap-2 border border-[var(--sc-brand-100)]"
              >
                <MessageSquare size={18} />
                New Message
              </button>
            </div>
          </>
        )}
      </div>

      <NewChatModal 
        isOpen={isNewChatOpen} 
        onClose={() => setIsNewChatOpen(false)} 
        onChatCreated={(chat) => {
          setIsNewChatOpen(false);
          setActiveChat(chat);
        }}
      />
    </>
  );
}
