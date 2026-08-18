import { Check, CheckCheck } from 'lucide-react';
import { Avatar } from '@heroui/react';

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isMine: boolean;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatBubbleProps {
  message: Message;
  showAvatar?: boolean; // Useful for group chats when consecutive messages are from the same person
}

export default function ChatBubble({ message, showAvatar }: ChatBubbleProps) {
  return (
    <div className={`flex w-full mb-4 ${message.isMine ? 'justify-end' : 'justify-start'}`}>
      {!message.isMine && showAvatar && (
        <div className="mr-2 flex-shrink-0 flex items-end">
          <Avatar src={message.senderAvatar} size="sm" className="w-8 h-8" />
        </div>
      )}
      
      {/* If showAvatar is true but this is a continuation message, add a placeholder width to align properly */}
      {!message.isMine && !showAvatar && (
        <div className="w-8 mr-2" />
      )}

      <div className={`flex flex-col max-w-[75%] ${message.isMine ? 'items-end' : 'items-start'}`}>
        {!message.isMine && message.senderName && showAvatar && (
          <span className="text-[12px] font-bold text-gray-500 mb-1 ml-1">{message.senderName}</span>
        )}
        
        <div 
          className={`relative px-4 py-2.5 text-[15px] leading-relaxed ${
            message.isMine 
              ? 'bg-[var(--sc-brand-600)] text-white rounded-2xl rounded-br-sm' 
              : 'bg-white border border-[var(--sc-border)] text-[var(--sc-text-primary)] rounded-2xl rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>
        
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[11px] font-medium text-gray-400">{message.timestamp}</span>
          {message.isMine && (
            <span className={message.status === 'read' ? 'text-[var(--sc-brand-500)]' : 'text-gray-300'}>
              {message.status === 'sent' ? <Check size={14} /> : <CheckCheck size={14} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
