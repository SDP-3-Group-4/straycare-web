import { NavLink } from 'react-router-dom';
import { Home, Bell, Store, Bookmark, User } from 'lucide-react';

const items = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/marketplace', icon: Store, label: 'Shop' },
  { to: '/bookmarks', icon: Bookmark, label: 'Saved' },
  { to: '/notifications', icon: Bell, label: 'Alerts' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function MobileNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[var(--sc-border)] flex justify-around items-center py-2 px-1 z-40 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-lg"
    >
      {items.map(({ to, icon: Icon, label, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 px-2 rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-[var(--sc-brand-600)] font-bold bg-[var(--sc-brand-50)] shadow-xs scale-105'
                : 'text-gray-500 hover:text-gray-900 font-medium'
            }`
          }
        >
          <Icon size={20} strokeWidth={2.2} />
          <span className="text-[10px] tracking-tight leading-none">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
