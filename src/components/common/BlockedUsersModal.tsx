import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, UserX, X, Check, Search, UserCheck } from 'lucide-react';

interface BlockedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BlockedUsersModal({ isOpen, onClose }: BlockedUsersModalProps) {
  const [blockedUsers, setBlockedUsers] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('straycare_blocked_users');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState('');
  const [unblockedToast, setUnblockedToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUnblock = (userId: string, name: string) => {
    const updated = blockedUsers.filter((u) => u.id !== userId);
    setBlockedUsers(updated);
    localStorage.setItem('straycare_blocked_users', JSON.stringify(updated));
    setUnblockedToast(`Unblocked ${name}`);
    setTimeout(() => setUnblockedToast(null), 2500);
  };

  const filtered = blockedUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.handle?.toLowerCase().includes(search.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col border border-[var(--sc-border)] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--sc-border)] bg-gray-50/70">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-red-50 text-red-600">
              <ShieldAlert size={18} />
            </div>
            <h2 className="text-base font-bold text-[var(--sc-text-primary)]">
              Blocked Accounts & Safety
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors border border-[var(--sc-border)]"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-4">
          <p className="text-xs text-gray-500">
            Blocked accounts cannot view your rescue posts, direct message you, or invite you to campaigns.
          </p>

          {unblockedToast && (
            <div className="p-2.5 bg-green-50 text-green-700 text-xs font-bold rounded-xl flex items-center gap-2 border border-green-200 animate-in fade-in duration-200">
              <UserCheck size={15} />
              <span>{unblockedToast}</span>
            </div>
          )}

          {blockedUsers.length > 0 && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search blocked users..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[var(--sc-border)] bg-gray-50 text-xs outline-none focus:border-[var(--sc-brand-400)]"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            {filtered.length > 0 ? (
              filtered.map((user) => (
                <div
                  key={user.id}
                  className="p-3 bg-gray-50 rounded-2xl border border-[var(--sc-border)] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-[var(--sc-text-primary)] block truncate">
                      {user.name || 'User'}
                    </span>
                    <span className="text-[11px] text-gray-400 block truncate">
                      @{user.handle || 'user'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUnblock(user.id, user.name || 'User')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-[var(--sc-border)] rounded-xl text-xs font-bold text-gray-700 transition-colors shadow-xs"
                  >
                    Unblock
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-[var(--sc-border)] flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-400 mb-2 border border-gray-200">
                  <UserX size={20} />
                </div>
                <span className="font-bold text-xs text-gray-700">No Blocked Accounts</span>
                <span className="text-[11px] text-gray-400 mt-0.5">
                  You haven't blocked any rescuers or community members.
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--sc-border)] bg-gray-50/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 font-bold text-gray-700 bg-white hover:bg-gray-100 border border-[var(--sc-border)] rounded-xl transition-all text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
