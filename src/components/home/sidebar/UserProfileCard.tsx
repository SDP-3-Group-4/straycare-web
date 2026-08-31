import { useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X, User, BadgeCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { avatarOnError } from '../../../constants';

export default function UserProfileCard() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
  };

  const confirmLogout = () => {
    logout();
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <>
      <NavLink 
        to="/profile"
        className={({ isActive }) => `flex items-center justify-between p-4 rounded-2xl transition-all w-full text-left mt-2 group relative overflow-hidden ${
          isActive 
            ? 'bg-[var(--sc-brand-500)] ring-4 ring-[var(--sc-brand-200)]' 
            : 'bg-[var(--sc-brand-500)] hover:bg-[var(--sc-brand-400)] shadow-md hover:shadow-lg'
        }`}
      >
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex-shrink-0 relative">
            <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white/10 ${
              (user.isVet || user.verifiedStatus) ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--sc-brand-500)]' : 'border-2 border-white/20'
            }`}>
              {user.photoUrl ? (
                <img 
                  src={user.photoUrl || undefined} 
                  alt={user.displayName || 'User'}
                  onError={avatarOnError}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User size={20} className="text-white/80" />
              )}
            </div>
            {(user.isVet || user.verifiedStatus) && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-xs">
                <BadgeCheck size={12} className="text-[var(--sc-brand-600)]" />
              </div>
            )}
          </div>
          <div className="hidden xl:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-[15px] truncate max-w-[110px] notranslate" translate="no">{user.displayName || 'User'}</span>
              {(user.isVet || user.verifiedStatus) && (
                <span className="px-1.5 py-0.5 bg-white/20 text-white text-[9px] font-bold uppercase rounded-md tracking-wider">Vet</span>
              )}
            </div>
            <span className="text-white/80 text-[13px] font-medium">View Profile</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="hidden xl:flex items-center justify-center p-2 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Logout"
        >
          <LogOut className="text-white/70 group-hover:text-white transition-colors relative z-10" size={18} />
        </button>
      </NavLink>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col border border-[var(--sc-border)] shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[var(--sc-border)] bg-gray-50/50">
              <h2 className="text-lg font-bold text-[var(--sc-text-primary)]">Confirm Logout</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors border border-[var(--sc-border)]">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-center">Are you sure you want to log out of your account?</p>
            </div>
            <div className="flex p-4 gap-3 border-t border-[var(--sc-border)] bg-gray-50/50">
              <button 
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="flex-1 py-2.5 font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
