import { useState, useEffect } from "react";
import { Avatar } from "@heroui/react";
import { Bot, MessageSquare, ChevronUp, ChevronDown, Plus } from "lucide-react";
import ChatConversation from "./ChatConversation";
import NewChatModal from "./NewChatModal";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchChats, createChat } from "../../../services/api";

export type Chat = {
  id: string;
  name: string;
  message: string;
  time: string;
  unread: number;
  avatar: string;
  isGroup?: boolean;
  isAiBot?: boolean;
};

export default function ChatWidget() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const loadChats = async () => {
      try {
        const data = await fetchChats(user.uid);
        const formattedChats = data.map((c: any) => {
          const date = new Date(c.latestMessageTime);
          const timeString = isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            id: c.id,
            name: c.name || "Unknown User",
            message: c.latestMessage || "No messages yet.",
            time: timeString,
            unread: c.unread,
            avatar: c.avatar || `https://i.pravatar.cc/150?u=${c.id}`,
            isGroup: c.isGroup,
            isAiBot: false,
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
      <div className="bg-white rounded-2xl border border-[var(--sc-border)] flex flex-col h-full max-h-[800px] relative z-10">
        <ChatConversation 
          chat={activeChat} 
          onBack={() => setActiveChat(null)} 
        />
      </div>
    );
  }

  const totalUnread = chats.reduce((acc, chat) => acc + chat.unread, 0);

  // Otherwise, render the Chat List view
  return (
    <>
      <div className={`bg-white rounded-2xl border border-[var(--sc-border)] flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-auto' : 'h-full max-h-[800px]'}`}>
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
            {/* AI Vet Bot Button */}
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
                      avatar: 'https://cdn-icons-png.flaticon.com/512/8649/8649603.png',
                      isAiBot: true
                    });
                  } catch (e) {
                    console.error("Failed to start AI chat", e);
                  }
                }}
                className="w-full relative overflow-hidden bg-[var(--sc-brand-500)] hover:bg-[var(--sc-brand-600)] rounded-2xl p-4 flex items-center gap-4 text-white transition-all group"
              >
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                  <Bot size={24} className="text-white" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[15px]">AI Vet Assistant</span>
                  <span className="text-xs text-white/90">Get instant advice</span>
                </div>
              </button>
            </div>

            {/* Chat List */}
            <div className="flex flex-col px-3 pb-2 overflow-y-auto flex-1">
              {chats.map((chat) => (
                <button 
                  key={chat.id} 
                  onClick={() => setActiveChat(chat)}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left w-full mb-1"
                >
                  <div className="relative">
                    <Avatar src={chat.avatar} size="md" />
                    {chat.unread > 0 && (
                      <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-bold text-[var(--sc-text-primary)] text-[14px] truncate">{chat.name}</span>
                      <span className="text-gray-400 text-[12px]">{chat.time}</span>
                    </div>
                    <span className={`text-[13px] truncate ${chat.unread > 0 ? 'text-[var(--sc-text-primary)] font-semibold' : 'text-gray-500'}`}>
                      {chat.message}
                    </span>
                  </div>
                </button>
              ))}
              {chats.length === 0 && (
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
