import { useState, useEffect } from 'react';
import { Heart, MessageSquare, DollarSign, UserPlus, Check, Bell, User } from "lucide-react";
import { useAuth } from '../../../contexts/AuthContext';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, acceptConnection, declineConnection, CONNECTIONS_UPDATED_EVENT } from '../../../services/api';
import { avatarOnError } from '../../../constants';

const getTypeConfig = (type: string) => {
  switch (type) {
    case 'like': return { icon: Heart, color: 'text-red-500', bg: 'bg-red-50' };
    case 'comment': return { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' };
    case 'connection': return { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-50' };
    case 'connection_accepted': return { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-50' };
    case 'donation': return { icon: DollarSign, color: 'text-[var(--sc-brand-500)]', bg: 'bg-[var(--sc-brand-50)]' };
    default: return { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-50' };
  }
};

export default function NotificationsFeed() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await fetchNotifications(user.uid);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsRead(user.uid);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const handleConnectionAction = async (id: string, action: 'accept' | 'decline', requesterId: string) => {
    if (!user) return;
    const notif = notifications.find(n => n.id === id);
    const senderName = notif?.sender?.displayName || 'User';
    try {
      if (action === 'accept') {
        await acceptConnection(requesterId);
      } else {
        await declineConnection(requesterId);
      }
      setNotifications(prev => prev.map(n => 
        n.id === id ? { 
          ...n, 
          type: action === 'accept' ? 'connection_accepted' : 'connection_declined', 
          isRead: true,
          content: action === 'accept' ? `You accepted ${senderName}'s connection request.` : `You declined ${senderName}'s connection request.`
        } : n
      ));
      window.dispatchEvent(new Event(CONNECTIONS_UPDATED_EVENT));
    } catch (err: any) {
      console.error(`Failed to ${action} connection:`, err);
      alert(err?.message || `Failed to ${action} connection`);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!user) return;
    if (!notif.isRead) {
      try {
        await markNotificationRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error("Failed to mark read:", err);
      }
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-24 pt-3 sm:pt-6 lg:pt-[74px] px-1 sm:px-0">
      <div className="flex items-center justify-between pb-3 px-2 sm:px-0">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--sc-text-primary)]">Notifications</h2>
        <button 
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-100)] text-[12px] sm:text-[13px] font-bold py-1.5 px-3.5 rounded-full transition-all"
        >
          <Check size={14} strokeWidth={3} />
          Mark all as read
        </button>
      </div>
      
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {notifications.map((notif) => {
          const { icon: Icon, color, bg } = getTypeConfig(notif.type);
          const timeString = new Date(notif.createdAt).toLocaleDateString();
          const senderName = notif.sender?.displayName || 'Someone';
          
          return (
            <div 
              key={notif.id} 
              onClick={() => handleNotificationClick(notif)}
              className={`flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border ${
                !notif.isRead 
                  ? 'bg-[var(--sc-brand-50)]/70 border-transparent shadow-xs' 
                  : 'bg-white border-[var(--sc-border)] hover:bg-gray-50'
              }`}
            >
              <div className="relative shrink-0">
                {notif.sender?.photoUrl ? (
                  <img src={notif.sender?.photoUrl} alt={notif.sender?.displayName || 'User'} onError={avatarOnError} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User size={18} className="text-gray-400" />
                  </div>
                )}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border-2 border-white ${bg}`}>
                  <Icon size={11} className={color} fill="currentColor" />
                </div>
              </div>
              
              <div className="flex flex-col flex-1 min-w-0">
                <div className="text-[13px] sm:text-[15px] text-[var(--sc-text-primary)] leading-snug">
                  <span className="font-bold">{senderName}</span> {notif.content}
                </div>
                <span className="text-[11px] sm:text-[12px] text-gray-400 mt-1">{timeString}</span>
                
                {notif.type === 'connection' && (
                  <div className="flex gap-2 mt-2.5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleConnectionAction(notif.id, 'accept', notif.senderId); }}
                      className="bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white text-[12px] sm:text-[13px] font-bold py-1.5 px-3.5 rounded-xl transition-colors active:scale-95"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleConnectionAction(notif.id, 'decline', notif.senderId); }}
                      className="bg-gray-100 hover:bg-gray-200 text-[var(--sc-text-secondary)] text-[12px] sm:text-[13px] font-bold py-1.5 px-3.5 rounded-xl transition-colors active:scale-95"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
              
              {!notif.isRead && (
                <div className="w-2.5 h-2.5 bg-[var(--sc-brand-500)] rounded-full mt-2 shrink-0"></div>
              )}
            </div>
          );
        })}
        
        {notifications.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-[var(--sc-border)] text-gray-500">
            <Bell size={28} className="mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-sm">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-0.5">We'll alert you when there are updates on your posts or connections.</p>
          </div>
        )}
      </div>
    </div>
  );
}
