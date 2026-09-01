import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Home, Bell, Store, Bookmark, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchNotifications } from "../../services/api";

const items = [
  { to: "/", icon: Home, label: "Home", exact: true },
  { to: "/marketplace", icon: Store, label: "Shop" },
  { to: "/bookmarks", icon: Bookmark, label: "Saved" },
  {
    to: "/notifications",
    icon: Bell,
    label: "Notifications",
    isNotification: true,
  },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function MobileNav() {
  const { user } = useAuth();
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      fetchNotifications(user.uid)
        .then((data) => {
          const unread = data.filter((n: any) => !n.isRead).length;
          setUnreadAlerts(unread);
        })
        .catch(console.error);
    }
  }, [user]);

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 glass-effect border-t border-[var(--sc-border)] flex justify-around items-center py-2 px-1 z-40 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-lg"
    >
      {items.map(({ to, icon: Icon, label, exact, isNotification }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 px-2 rounded-xl transition-all duration-200 relative ${
              isActive
                ? "text-[var(--sc-brand-600)] font-bold bg-[var(--sc-brand-50)] shadow-xs scale-105"
                : "text-gray-500 hover:text-gray-900 font-medium"
            }`
          }
        >
          <div className="relative">
            <Icon size={20} strokeWidth={2.2} />
            {isNotification && unreadAlerts > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {unreadAlerts > 9 ? "9+" : unreadAlerts}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight leading-none">
            {label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
