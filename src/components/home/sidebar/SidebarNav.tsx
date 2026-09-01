import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Bell, Store, Bookmark, Settings } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchNotifications } from "../../../services/api";

const navItems = [
  { label: "Home", icon: Home, path: "/", badge: 0 },
  { label: "Notifications", icon: Bell, path: "/notifications", badge: 0 },
  { label: "Marketplace", icon: Store, path: "/marketplace", badge: 0 },

  { label: "Bookmarks", icon: Bookmark, path: "/bookmarks", badge: 0 },
  { label: "Settings", icon: Settings, path: "/settings", badge: 0 },
];

export default function SidebarNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      fetchNotifications(user.uid)
        .then((notifications) => {
          const unread = notifications.filter((n: any) => !n.isRead).length;
          setUnreadCount(unread);
        })
        .catch((err) =>
          console.error("Failed to load notifications count", err),
        );
    }
  }, [user]);

  return (
    <nav className="flex flex-col gap-1 w-full">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const displayBadge =
          item.label === "Notifications" ? unreadCount : item.badge;

        return (
          <NavLink
            key={item.label}
            to={item.path}
            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-200 group ${isActive
                ? "bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)]"
                : "text-gray-500 hover:bg-gray-100 hover:text-[var(--sc-text-primary)]"
              }`}
          >
            <div className="flex items-center gap-4">
              <item.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                fill={isActive ? "currentColor" : "none"}
                className={
                  isActive
                    ? "text-[var(--sc-brand-600)]"
                    : "text-gray-400 group-hover:text-[var(--sc-text-primary)]"
                }
              />
              <span
                className={`text-[15px] ${isActive ? "font-bold" : "font-medium"}`}
              >
                {item.label}
              </span>
            </div>

            {displayBadge > 0 && (
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isActive ? "bg-[var(--sc-brand-100)] text-[var(--sc-brand-600)]" : "bg-gray-100 text-gray-500"}`}
              >
                {displayBadge}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
