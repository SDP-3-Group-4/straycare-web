import { type ReactNode } from "react";
import { Check, CheckCheck, Sparkles } from "lucide-react";

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  day?: string;
  isMine: boolean;
  status: "sent" | "delivered" | "read";
}

interface ChatBubbleProps {
  message: Message;
  showAvatar?: boolean; // Useful for group chats when consecutive messages are from the same person
  isBot?: boolean; // Styling for AI assistant messages
}

function fixMojibake(s: string): string {
  if (/[≡ƒΓ£¿]/.test(s)) {
    try {
      const bytes = Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff);
      const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      if (decoded && decoded !== s && !decoded.includes("�")) return decoded;
    } catch {}
  }
  return s;
}

function renderContent(content: string) {
  const fixed = fixMojibake(content);
  const lines = fixed.split(/\n\n|\n/);
  return lines.map((line, i) => {
    const parts = line.split(/\*\*(.+?)\*\*/g);
    const nodes: ReactNode[] = [];
    parts.forEach((part, j) => {
      if (part === "") return;
      nodes.push(
        j % 2 === 1 ? (
          <strong key={j}>{part}</strong>
        ) : (
          <span key={j}>{part}</span>
        ),
      );
    });
    return (
      <span key={i} className="block">
        {nodes}
      </span>
    );
  });
}

export default function ChatBubble({
  message,
  showAvatar,
  isBot,
}: ChatBubbleProps) {
  return (
    <div
      className={`flex w-full mb-4 ${message.isMine ? "justify-end" : "justify-start"}`}
    >
      {!message.isMine && showAvatar && (
        <div className="mr-2 flex-shrink-0 flex items-end">
          {isBot ? (
            <div className="w-8 h-8 rounded-full bg-[var(--sc-brand-50)] border border-[var(--sc-brand-200)] flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs">
              <img
                src={message.senderAvatar}
                alt={message.senderName}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <img
              src={message.senderAvatar}
              alt={message.senderName}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
        </div>
      )}

      {/* If showAvatar is true but this is a continuation message, add a placeholder width to align properly */}
      {!message.isMine && !showAvatar && <div className="w-8 mr-2" />}

      <div
        className={`flex flex-col max-w-[75%] ${message.isMine ? "items-end" : "items-start"}`}
      >
        {!message.isMine && message.senderName && showAvatar && (
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-gray-500 mb-1 ml-1">
            {message.senderName}
            {isBot && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[var(--sc-brand-600)] bg-[var(--sc-brand-100)] px-1.5 py-0.5 rounded-full">
                <Sparkles size={9} />
                AI
              </span>
            )}
          </span>
        )}

        <div
          className={`relative px-4 py-2.5 text-[15px] leading-relaxed ${
            message.isMine
              ? "bg-[var(--sc-brand-600)] text-white rounded-2xl rounded-br-sm"
              : isBot
                ? "bg-[var(--sc-brand-50)] border border-[var(--sc-brand-200)] text-[var(--sc-text-primary)] rounded-2xl rounded-bl-sm"
                : "bg-white border border-[var(--sc-border)] text-[var(--sc-text-primary)] rounded-2xl rounded-bl-sm"
          }`}
        >
          {renderContent(message.content)}
        </div>

        <div className="flex items-center gap-1 mt-1">
          <span className="text-[11px] font-medium text-gray-400">
            {message.timestamp}
          </span>
          {message.isMine && (
            <span
              className={
                message.status === "read"
                  ? "text-[var(--sc-brand-500)]"
                  : "text-gray-300"
              }
            >
              {message.status === "sent" ? (
                <Check size={14} />
              ) : (
                <CheckCheck size={14} />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
