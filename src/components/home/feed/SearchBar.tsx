import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Bookmark, Store, Bell, Settings, Home, ShieldCheck } from "lucide-react";
import { fetchUsers } from "../../../services/api";
import { avatarOnError } from "../../../constants";

type SearchUser = { id: string; displayName: string; handle: string; photoUrl?: string; bio?: string };
const SETTINGS_OPTIONS = [
  { id: 'home', label: 'Home Feed', sub: 'Go to home', icon: Home, path: '/' },
  { id: 'bookmarks', label: 'Bookmarks', sub: 'Saved posts', icon: Bookmark, path: '/bookmarks' },
  { id: 'marketplace', label: 'Marketplace', sub: 'Pet products & services', icon: Store, path: '/marketplace' },
  { id: 'notifications', label: 'Notifications', sub: 'Activity & alerts', icon: Bell, path: '/notifications' },
  { id: 'profile', label: 'Profile', sub: 'Your posts & connections', icon: User, path: '/profile' },
  { id: 'settings', label: 'Settings', sub: 'Privacy, account & verification', icon: Settings, path: '/settings' },
  { id: 'vet', label: 'Vet Verification', sub: 'Apply for verified badge', icon: ShieldCheck, path: '/settings' },
];

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SearchUser[]>([]);
  const [filteredSettings, setFilteredSettings] = useState<typeof SETTINGS_OPTIONS>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!query.trim()) { setFilteredUsers([]); setFilteredSettings([]); return; }
      setLoading(true);
      try {
        if (users.length === 0) {
          const data = await fetchUsers();
          if (!cancelled) setUsers(data);
        }
      } catch {}
      setLoading(false);
    };
    const t = setTimeout(load, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setFilteredUsers([]); setFilteredSettings([]); return; }
    setFilteredUsers(users.filter(u => 
      u.displayName?.toLowerCase().includes(q) || 
      u.handle?.toLowerCase().includes(q) ||
      u.bio?.toLowerCase().includes(q)
    ).slice(0, 5));
    setFilteredSettings(SETTINGS_OPTIONS.filter(s => 
      s.label.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q)
    ).slice(0, 4));
  }, [query, users]);

  const hasResults = filteredUsers.length > 0 || filteredSettings.length > 0;
  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={wrapRef} className="relative group w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search size={18} className="text-[var(--sc-text-muted)] group-focus-within:text-[var(--sc-brand-500)]" />
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        className="w-full bg-gray-100 hover:bg-gray-200 focus:bg-white border border-transparent focus:border-[var(--sc-brand-500)] rounded-full py-3 pl-12 pr-4 text-[15px] text-[var(--sc-text-primary)] placeholder-[var(--sc-text-muted)] outline-none transition-colors"
        placeholder=" Search"
      />

      {showDropdown && (
        <div className="absolute top-full mt-2 w-full bg-white border border-[var(--sc-border)] rounded-2xl shadow-xl overflow-hidden z-50 max-h-[420px] flex flex-col">
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-400">Searching...</div>
            ) : !hasResults ? (
              <div className="p-4 text-center text-sm text-gray-400">No results for “{query}”</div>
            ) : (
              <>
                {filteredUsers.length > 0 && (
                  <div className="p-2">
                    <p className="text-[11px] font-bold tracking-widest text-gray-400 px-3 py-1.5 uppercase">Users</p>
                    {filteredUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => { setIsOpen(false); navigate(`/profile?id=${u.id}`); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                      >
                        {u.photoUrl ? (
                          <img src={u.photoUrl} alt={u.displayName} onError={avatarOnError} className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <User size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-bold text-[14px] text-[var(--sc-text-primary)] truncate">{u.displayName}</span>
                          <span className="text-[12px] text-gray-500 truncate">@{u.handle}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {filteredSettings.length > 0 && (
                  <div className="p-2 border-t border-[var(--sc-border)]">
                    <p className="text-[11px] font-bold tracking-widest text-gray-400 px-3 py-1.5 uppercase">Settings & Pages</p>
                    {filteredSettings.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setIsOpen(false); navigate(s.path); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] flex items-center justify-center shrink-0">
                          <s.icon size={16} />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-bold text-[14px] text-[var(--sc-text-primary)] truncate">{s.label}</span>
                          <span className="text-[12px] text-gray-500 truncate">{s.sub}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
