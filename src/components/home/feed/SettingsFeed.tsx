import {
  User, Mail, Key, Bell, Smartphone, Moon, Globe,
  ShieldAlert, EyeOff, FileText, HelpCircle, ChevronRight,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface SettingItem {
  icon: LucideIcon;
  label: string;
  value: string;
  active?: boolean;
}

const SETTING_SECTIONS: { title: string; items: SettingItem[] }[] = [
  {
    title: 'Account Settings',
    items: [
      { icon: User, label: 'Edit Profile', value: 'Manage display name & bio' },
      { icon: Mail, label: 'Email Address', value: 'Account verification' },
      { icon: Key, label: 'Password & Security', value: 'Manage login credentials' },
    ]
  },
  {
    title: 'Notification Preferences',
    items: [
      { icon: Bell, label: 'Push Notifications', value: 'Enabled', active: true },
      { icon: Smartphone, label: 'Email Notifications', value: 'Direct updates', active: true },
    ]
  },
  {
    title: 'App Preferences',
    items: [
      { icon: Moon, label: 'Theme', value: 'Light mode' },
      { icon: Globe, label: 'Language', value: 'English (US)' },
    ]
  },
  {
    title: 'Privacy & Safety',
    items: [
      { icon: EyeOff, label: 'Profile Visibility', value: 'Public' },
      { icon: ShieldAlert, label: 'Blocked Users', value: '0 users blocked' },
    ]
  },
  {
    title: 'Help & Legal',
    items: [
      { icon: HelpCircle, label: 'Help Center & Support', value: '' },
      { icon: FileText, label: 'Terms of Service & Privacy', value: '' },
    ]
  }
];

export default function SettingsFeed() {
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-24 pt-3 sm:pt-6 lg:pt-[74px] px-1 sm:px-0">
      
      <div className="flex flex-col gap-6">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--sc-text-primary)] px-2 sm:px-0">Settings</h2>
        
        {SETTING_SECTIONS.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-2.5">
            <h3 className="text-[12px] sm:text-[13px] font-bold text-[var(--sc-text-secondary)] uppercase tracking-wider pl-2">
              {section.title}
            </h3>
            
            <div className="bg-white rounded-2xl border border-[var(--sc-border)] overflow-hidden shadow-xs">
              {section.items.map((item, itemIdx) => (
                <button 
                  key={item.label}
                  className={`w-full flex items-center justify-between p-3.5 sm:p-4 text-left transition-all hover:bg-gray-50 group ${
                    itemIdx !== section.items.length - 1 ? 'border-b border-[var(--sc-border)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                      item.active ? 'bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)]' : 'bg-gray-50 text-gray-500 group-hover:bg-[var(--sc-brand-50)] group-hover:text-[var(--sc-brand-600)]'
                    }`}>
                      <item.icon size={18} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-[14px] sm:text-[15px] text-[var(--sc-text-primary)] truncate">
                        {item.label}
                      </span>
                      {item.value && (
                        <span className="text-[12px] sm:text-[13px] text-gray-500 truncate">
                          {item.value}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-[var(--sc-brand-500)] transition-colors shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Log Out Button */}
        <div className="mt-2 mb-6">
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-bold transition-all border border-transparent hover:border-red-200 text-[14px] sm:text-[15px]"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>

      </div>
    </div>
  );
}
