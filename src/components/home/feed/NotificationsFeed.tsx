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
    try {
      if (action === 'accept') {
        await acceptConnection(requesterId);
      } else {
        await declineConnection(requesterId);
      }
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, type: action === 'accept' ? 'connection_accepted' : 'connection_declined', isRead: true } : n
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
    
    // Link to post if it has one
    if (notif.postId) {
      // In a real app we might use react-router navigate here
      // For now, if we are in tabs we could set a state, or just alert since there isn't a dedicated post page yet
      // Actually, if we have a post page, window.location.href = `/post/${notif.postId}`
      console.log(`Navigate to post ${notif.postId}`);
      // Assuming no router setup for single post view yet, just log or trigger a modal
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-20 pt-[112px]">
      <div className="flex justify-end pb-2 px-4 sm:px-0">
        <button 
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-100)] text-[13px] font-bold py-1.5 px-4 rounded-full transition-all"
        >
          <Check size={14} strokeWidth={3} />
          Mark all as read
        </button>
      </div>
      
      <div className="flex flex-col pt-4 px-4 sm:px-0 gap-3">
        {notifications.map((notif) => {
          const { icon: Icon, color, bg } = getTypeConfig(notif.type);
          const timeString = new Date(notif.createdAt).toLocaleDateString();
          const senderName = notif.sender?.displayName || 'Someone';
          
          return (
            <div 
              key={notif.id} 
              onClick={() => handleNotificationClick(notif)}
              className={`flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer border ${
                !notif.isRead 
                  ? 'bg-[var(--sc-brand-50)] border-transparent' 
                  : 'bg-white border-[var(--sc-border)] hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                {notif.sender?.photoUrl ? (
                  <img src={notif.sender?.photoUrl} alt={notif.sender?.displayName || 'User'} onError={avatarOnError} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User size={20} className="text-gray-400" />
                  </div>
                )}
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white ${bg}`}>
                  <Icon size={12} className={color} fill="currentColor" />
                </div>
              </div>
              
              <div className="flex flex-col flex-1">
                <div className="text-[15px] text-[var(--sc-text-primary)]">
                  <span className="font-bold">{senderName}</span> {notif.content}
                </div>
                <span className="text-[13px] text-gray-500 mt-0.5">{timeString}</span>
                
                {notif.type === 'connection' && (
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleConnectionAction(notif.id, 'accept', notif.senderId); }}
                      className="bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white text-[14px] font-bold py-1.5 px-4 rounded-xl transition-colors"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleConnectionAction(notif.id, 'decline', notif.senderId); }}
                      className="bg-gray-100 hover:bg-gray-200 text-[var(--sc-text-secondary)] text-[14px] font-bold py-1.5 px-4 rounded-xl transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
              
              {!notif.isRead && (
                <div className="w-2.5 h-2.5 bg-[var(--sc-brand-500)] rounded-full mt-2"></div>
              )}
            </div>
          );
        })}
        
        {notifications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No notifications yet.
          </div>
        )}
      </div>
    </div>
  );
}
