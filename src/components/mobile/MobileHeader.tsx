import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Cross, MessageSquare, X, User, BadgeCheck } from 'lucide-react';
import logo from '../../assets/logo.svg';
import { useAuth } from '../../contexts/AuthContext';
import { avatarOnError } from '../../constants';
import { fetchChats } from '../../services/api';
import SearchBar from '../home/feed/SearchBar';
import NearbyClinicsWidget from '../home/sidebar/NearbyClinicsWidget';
import ChatWidget from '../home/panel/ChatWidget';
import ProfileFlyoutMenu from '../common/ProfileFlyoutMenu';

export default function MobileHeader() {
  const { user } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showClinicsModal, setShowClinicsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showProfileFlyout, setShowProfileFlyout] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const isVerifiedVet = Boolean(user?.isVet || user?.verifiedStatus);

  useEffect(() => {
    if (user?.uid) {
      fetchChats(user.uid)
        .then((chats: any[]) => {
          const totalUnread = chats
            .filter((c) => c.otherUserId !== 'ai-vet-bot-id')
            .reduce((acc, c) => acc + (c.unread || 0), 0);
          setUnreadMessages(totalUnread);
        })
        .catch(console.error);
    }
  }, [user]);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[var(--sc-border)] px-3.5 py-2.5 flex items-center justify-between shadow-xs">
        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="StrayCare Logo" className="h-7 w-auto object-contain" />
        </Link>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Search Toggle Button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-full transition-colors ${
              showSearch ? 'bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)]' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Search"
            aria-label="Search"
          >
            <Search size={19} />
          </button>

          {/* Nearby Clinics Button */}
          <button
            onClick={() => setShowClinicsModal(true)}
            className="p-2 text-gray-600 hover:text-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-50)] rounded-full transition-colors relative"
            title="Nearby Clinics"
            aria-label="Nearby Clinics"
          >
            <Cross size={19} className="text-red-500" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </button>

          {/* Chat & AI Vet Assistant Button */}
          <button
            onClick={() => setShowChatModal(true)}
            className="p-2 text-gray-600 hover:text-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-50)] rounded-full transition-colors relative"
            title="Messages & AI Vet"
            aria-label="Messages & AI Vet Assistant"
          >
            <MessageSquare size={19} className="text-[var(--sc-brand-600)]" />
            {unreadMessages > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {unreadMessages}
              </span>
            )}
          </button>

          {/* User Profile DP Button with Vet Ring, Badge & Settings Flyout Trigger */}
          <button
            onClick={() => setShowProfileFlyout(true)}
            className="ml-1 shrink-0 relative p-0.5 rounded-full transition-transform active:scale-95 focus:outline-none"
            aria-label="Open settings and profile menu"
            title="Settings & Profile"
          >
            <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 ${
              isVerifiedVet ? 'ring-2 ring-offset-2 ring-[var(--sc-brand-500)]' : 'border border-gray-200'
            }`}>
              {user?.photoURL || user?.photoUrl ? (
                <img
                  src={user?.photoURL || user?.photoUrl || undefined}
                  alt={user?.displayName || 'User'}
                  onError={avatarOnError}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={16} className="text-gray-400" />
              )}
            </div>
            {isVerifiedVet && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-xs">
                <BadgeCheck size={11} className="text-[var(--sc-brand-500)]" />
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Profile & Settings Flyout Menu */}
      <ProfileFlyoutMenu
        isOpen={showProfileFlyout}
        onClose={() => setShowProfileFlyout(false)}
      />

      {/* Expandable Search Input on Mobile */}
      {showSearch && (
        <div className="lg:hidden bg-white border-b border-[var(--sc-border)] p-3 animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm">
          <SearchBar />
        </div>
      )}

      {/* Mobile Nearby Clinics Modal / Sheet */}
      {showClinicsModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowClinicsModal(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto flex flex-col border border-[var(--sc-border)] shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white/95 backdrop-blur-md border-b border-[var(--sc-border)]">
              <h3 className="font-bold text-base text-[var(--sc-text-primary)]">Nearby 24/7 Vet Clinics</h3>
              <button
                onClick={() => setShowClinicsModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <NearbyClinicsWidget />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Messages & AI Vet Modal / Sheet */}
      {showChatModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowChatModal(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg h-[90vh] flex flex-col border border-[var(--sc-border)] shadow-2xl animate-in slide-in-from-bottom-5 duration-300 overflow-hidden">
            <div className="flex items-center justify-between p-3.5 bg-white border-b border-[var(--sc-border)] shrink-0">
              <span className="font-bold text-[15px] text-[var(--sc-text-primary)]">Messages & AI Assistant</span>
              <button
                onClick={() => setShowChatModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <ChatWidget />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
