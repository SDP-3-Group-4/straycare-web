import { NavLink } from 'react-router-dom';
import { Home, Bell, Store, Bookmark, User, Settings } from 'lucide-react';

const items = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/marketplace', icon: Store, label: 'Shop' },
  { to: '/bookmarks', icon: Bookmark, label: 'Saved' },
  { to: '/notifications', icon: Bell, label: 'Alerts' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--sc-border)] flex justify-around items-center py-2 px-2 z-40 pb-[env(safe-area-inset-bottom)]">
      {items.map(({ to, icon: Icon, label, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) => `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${isActive ? 'text-[var(--sc-brand-600)] bg-[var(--sc-brand-50)]' : 'text-gray-500'}`}
        >
          <Icon size={18} />
          <span className="text-[10px] font-bold leading-none">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
