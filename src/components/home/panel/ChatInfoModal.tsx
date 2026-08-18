import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Settings, LogOut, Bell, BellOff, Image as ImageIcon, Trash2, ShieldAlert } from 'lucide-react';
import { Avatar } from '@heroui/react';

interface ChatInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: {
    id: number | string;
    name: string;
    avatar?: string;
    isGroup?: boolean;
    isAiBot?: boolean;
  };
}

export default function ChatInfoModal({ isOpen, onClose, chat }: ChatInfoModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(chat.name);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col border border-[var(--sc-border)]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--sc-border)] bg-white sticky top-0 z-10">
          <h2 className="text-[18px] font-bold text-[var(--sc-text-primary)]">
            {chat.isGroup ? 'Group Info' : chat.isAiBot ? 'Bot Info' : 'Contact Info'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors border border-[var(--sc-border)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto pb-6">
          {/* Profile Section */}
          <div className="flex flex-col items-center pt-8 pb-6 px-6 border-b border-[var(--sc-border)]">
            <div className="relative group mb-4">
              <Avatar src={chat.avatar} className="w-24 h-24 text-large" />
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
                <h3 className="font-bold text-[20px] text-[var(--sc-text-primary)]">{chat.name}</h3>
                {chat.isGroup && (
                  <button onClick={() => setIsEditingName(true)} className="text-[var(--sc-brand-600)] hover:text-[var(--sc-brand-700)]">
                    <Settings size={16} />
                  </button>
                )}
              </div>
            )}
            
            <p className="text-[14px] text-gray-500 mt-1">
              {chat.isGroup ? '3 Members' : chat.isAiBot ? 'Virtual Assistant' : '@username'}
            </p>
          </div>

          {/* Actions Menu */}
          <div className="flex flex-col p-3">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMuted ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                {isMuted ? <BellOff size={18} /> : <Bell size={18} />}
              </div>
              <div className="flex flex-col flex-1">
                <span className="font-bold text-[15px] text-[var(--sc-text-primary)]">Mute Notifications</span>
                <span className="text-[12px] text-gray-500">{isMuted ? 'Notifications are paused' : 'Receive alerts for new messages'}</span>
              </div>
              {/* Toggle switch visual (fake) */}
              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isMuted ? 'bg-[var(--sc-brand-500)]' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isMuted ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>

            {chat.isGroup && (
              <>
                <div className="h-px bg-[var(--sc-border)] my-2 mx-3"></div>
                <button className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <span className="font-bold text-[15px] text-[var(--sc-text-primary)]">Manage Members</span>
                </button>
                
                <button className="flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 transition-colors w-full text-left group">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                    <LogOut size={18} />
                  </div>
                  <span className="font-bold text-[15px] text-red-600">Leave Group</span>
                </button>
              </>
            )}

            {!chat.isGroup && !chat.isAiBot && (
              <>
                <div className="h-px bg-[var(--sc-border)] my-2 mx-3"></div>
                <button className="flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 transition-colors w-full text-left group">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                    <ShieldAlert size={18} />
                  </div>
                  <span className="font-bold text-[15px] text-red-600">Block & Report</span>
                </button>
              </>
            )}

            <button className="flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 transition-colors w-full text-left group mt-1">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                <Trash2 size={18} />
              </div>
              <span className="font-bold text-[15px] text-red-600">Delete Chat</span>
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
