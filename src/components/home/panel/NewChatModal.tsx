import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Users, Check } from 'lucide-react';
import { Avatar } from '@heroui/react';
import { fetchUsers, createChat } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated?: (chat: any) => void;
}

export default function NewChatModal({ isOpen, onClose, onChatCreated }: NewChatModalProps) {
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchUsers().then(data => setUsers(data)).catch(err => console.error("Failed to fetch users", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    u.id !== user?.uid && 
    (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.handle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleUser = async (id: string) => {
    if (mode === 'direct') {
      try {
        if (!user) return;
        const newConv = await createChat(user.uid, id);
        
        // Find the user we just started a chat with
        const targetUser = users.find(u => u.id === id);
        
        if (onChatCreated) {
          onChatCreated({
            id: newConv.id,
            name: targetUser?.displayName || 'Unknown',
            avatar: targetUser?.photoUrl,
            message: '',
            time: '',
            unread: 0,
            isGroup: false,
          });
        } else {
          onClose();
        }
      } catch (err) {
        console.error("Failed to create chat:", err);
      }
    } else {
      setSelectedUsers(prev => 
        prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
      );
    }
  };

  const handleCreateGroup = () => {
    // In a real app, this would create the group and open the chat
    if (groupName && selectedUsers.length > 0) {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-[var(--sc-border)] shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--sc-border)] bg-gray-50/50 shrink-0">
          <h2 className="text-lg font-bold text-[var(--sc-text-primary)]">
            New Message
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors border border-[var(--sc-border)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          
          {/* Mode Toggle & Search */}
          <div className="p-4 border-b border-[var(--sc-border)] shrink-0">
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
              <button 
                onClick={() => { setMode('direct'); setSelectedUsers([]); setGroupName(''); }}
                className={`flex-1 py-2 text-[14px] font-bold rounded-lg transition-colors ${mode === 'direct' ? 'bg-white shadow-sm text-[var(--sc-text-primary)]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Direct
              </button>
              <button 
                onClick={() => setMode('group')}
                className={`flex-1 py-2 text-[14px] font-bold rounded-lg transition-colors ${mode === 'group' ? 'bg-white shadow-sm text-[var(--sc-text-primary)]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Group
              </button>
            </div>

            {mode === 'group' && (
              <div className="mb-4">
                <input 
                  type="text" 
                  placeholder="Group Name (e.g. Rescue Coordination)" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-gray-50 border border-[var(--sc-border)] px-4 py-3 rounded-xl text-[14px] focus:outline-none focus:border-[var(--sc-brand-500)] focus:bg-white transition-colors"
                />
              </div>
            )}

            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--sc-brand-500)] transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search people..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[var(--sc-border)] pl-10 pr-4 py-2.5 rounded-xl text-[14px] focus:outline-none focus:border-[var(--sc-brand-500)] transition-colors"
              />
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-2">
            {mode === 'group' && selectedUsers.length > 0 && (
              <div className="px-3 py-2 flex flex-wrap gap-2 mb-2">
                {selectedUsers.map(id => {
                  const u = users.find(u => u.id === id);
                  return u ? (
                    <div key={id} className="flex items-center gap-1.5 bg-[var(--sc-brand-50)] border border-[var(--sc-brand-100)] rounded-full pl-1.5 pr-2 py-1">
                      <Avatar src={u.photoUrl} className="w-5 h-5" />
                      <span className="text-[12px] font-bold text-[var(--sc-brand-700)]">{u.displayName.split(' ')[0]}</span>
                      <button onClick={() => toggleUser(id)} className="text-[var(--sc-brand-400)] hover:text-[var(--sc-brand-600)] ml-1">
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            )}

            <div className="flex flex-col gap-1">
              {filteredUsers.map(u => {
                const isSelected = selectedUsers.includes(u.id);
                return (
                  <button 
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left"
                  >
                    <div className="relative">
                      <Avatar src={u.photoUrl} size="md" />
                      {mode === 'group' && (
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white transition-colors ${
                          isSelected ? 'bg-[var(--sc-brand-500)]' : 'bg-gray-200'
                        }`}>
                          {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="font-bold text-[15px] text-[var(--sc-text-primary)]">{u.displayName}</span>
                      <span className="text-[13px] text-gray-500">{u.handle}</span>
                    </div>
                  </button>
                );
              })}
              {filteredUsers.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No users found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer for Group Mode */}
        {mode === 'group' && (
          <div className="p-4 border-t border-[var(--sc-border)] shrink-0">
            <button 
              disabled={selectedUsers.length === 0 || !groupName.trim()}
              onClick={handleCreateGroup}
              className={`w-full py-3.5 text-[15px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                selectedUsers.length > 0 && groupName.trim()
                  ? 'bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white border border-[var(--sc-brand-700)]' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
            >
              <Users size={18} />
              Create Group Chat
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
