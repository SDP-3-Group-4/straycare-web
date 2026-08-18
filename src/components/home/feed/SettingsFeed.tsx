import { 
  User, Mail, Key, Bell, Smartphone, Moon, Globe, 
  ShieldAlert, EyeOff, FileText, HelpCircle, ChevronRight,
  LogOut
} from 'lucide-react';

const SETTING_SECTIONS = [
  {
    title: 'Account Settings',
    items: [
      { icon: User, label: 'Edit Profile', value: 'Alex Johnson' },
      { icon: Mail, label: 'Email Address', value: 'alex@example.com' },
      { icon: Key, label: 'Change Password', value: 'Updated 2 months ago' },
    ]
  },
  {
    title: 'Notification Preferences',
    items: [
      { icon: Bell, label: 'Push Notifications', value: 'Enabled', active: true },
      { icon: Smartphone, label: 'Email Notifications', value: 'Only for direct messages', active: true },
    ]
  },
  {
    title: 'App Preferences',
    items: [
      { icon: Moon, label: 'Theme', value: 'System Default' },
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
  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-20">
      
      <div className="flex flex-col gap-8 px-4 sm:px-0 pt-[112px]">
        
        {SETTING_SECTIONS.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-3">
            <h3 className="text-[13px] font-bold text-[var(--sc-text-secondary)] uppercase tracking-wider pl-2">
              {section.title}
            </h3>
            
            <div className="bg-white rounded-2xl border border-[var(--sc-border)] overflow-hidden">
              {section.items.map((item, itemIdx) => (
                <button 
                  key={item.label}
                  className={`w-full flex items-center justify-between p-4 text-left transition-all hover:bg-gray-50 group ${
                    itemIdx !== section.items.length - 1 ? 'border-b border-[var(--sc-border)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl transition-colors ${
                      item.active ? 'bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)]' : 'bg-gray-50 text-gray-500 group-hover:bg-[var(--sc-brand-50)] group-hover:text-[var(--sc-brand-600)]'
                    }`}>
                      <item.icon size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[15px] text-[var(--sc-text-primary)]">
                        {item.label}
                      </span>
                      {item.value && (
                        <span className="text-[13px] text-gray-500 mt-0.5">
                          {item.value}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[var(--sc-brand-500)] transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Log Out Button */}
        <div className="mt-4 mb-8">
          <button className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-bold transition-all border border-transparent hover:border-red-200">
            <LogOut size={18} />
            Log Out
          </button>
        </div>

      </div>
    </div>
  );
}
