import { useState, useEffect } from 'react';
import {
  User, Mail, Key, Bell, Moon, Sun, Monitor, Globe,
  ShieldAlert, EyeOff, Eye, FileText, HelpCircle, ChevronRight,
  LogOut, ShieldCheck, MapPin, Download, Check, Sparkles, AlertCircle,
  MessageSquare, HeartHandshake, Shield, Smartphone, Trash2, Sliders, Type, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { avatarOnError } from '../../../constants';
import { getStoredPreferences, savePreferences, type UserPreferences } from '../../../services/preferences';
import EditProfileModal from './EditProfileModal';
import VetVerificationModal from './VetVerificationModal';
import PasswordSecurityModal from '../../common/PasswordSecurityModal';
import BlockedUsersModal from '../../common/BlockedUsersModal';
import PolicyModal, { type PolicyType } from '../../common/PolicyModal';

const LANGUAGES = [
  { code: 'en', name: 'English (US)', flag: '🇺🇸' },
  { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇧🇩' },
  { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦' },
];

export default function SettingsFeed() {
  const { user, logout } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences>(getStoredPreferences());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVetModalOpen, setIsVetModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [policyModalType, setPolicyModalType] = useState<PolicyType | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dataExported, setDataExported] = useState(false);

  const isVerifiedVet = Boolean(user?.isVet || user?.verifiedStatus);

  useEffect(() => {
    const handlePrefsChange = (e: any) => {
      if (e.detail) setPrefs(e.detail);
    };
    window.addEventListener('straycare:preferences-changed', handlePrefsChange);
    return () => window.removeEventListener('straycare:preferences-changed', handlePrefsChange);
  }, []);

  const handleLocationChange = (mode: 'precise' | 'city' | 'hidden') => {
    const updated = savePreferences({ locationPrivacy: mode });
    setPrefs(updated);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    const updated = savePreferences({ theme });
    setPrefs(updated);
  };

  const handleLanguageChange = (langCode: string) => {
    const updated = savePreferences({ language: langCode });
    setPrefs(updated);
  };

  const handleFontSizeChange = (size: 'normal' | 'large') => {
    const updated = savePreferences({ fontSize: size });
    setPrefs(updated);
  };

  const toggleBlurSensitive = () => {
    const updated = savePreferences({ blurSensitiveMedia: !prefs.blurSensitiveMedia });
    setPrefs(updated);
  };

  const toggleEmergencyAlerts = () => {
    const updated = savePreferences({ emergencyAlerts: !prefs.emergencyAlerts });
    setPrefs(updated);
  };

  const togglePostAlerts = () => {
    const updated = savePreferences({ postInteractionAlerts: !prefs.postInteractionAlerts });
    setPrefs(updated);
  };

  const toggleDonationAlerts = () => {
    const updated = savePreferences({ donationAlerts: !prefs.donationAlerts });
    setPrefs(updated);
  };

  const toggleEmailAlerts = () => {
    const updated = savePreferences({ emailAlerts: !prefs.emailAlerts });
    setPrefs(updated);
  };

  const handleMessagePrivacyChange = (privacy: 'anyone' | 'connections') => {
    const updated = savePreferences({ whoCanMessage: privacy });
    setPrefs(updated);
  };

  const handleExportData = () => {
    if (!user) return;
    const userData = {
      user: {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        handle: (user as any).handle,
        isVet: user.isVet,
        verifiedStatus: user.verifiedStatus,
        location: (user as any).location,
      },
      preferences: prefs,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `straycare-data-${user.uid}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDataExported(true);
    setTimeout(() => setDataExported(false), 3000);
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-24 pt-3 sm:pt-6 lg:pt-[74px] px-1 sm:px-0">
      <div className="flex flex-col gap-6">
        
        {/* Page Title */}
        <div className="px-2 sm:px-0">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--sc-text-primary)]">Settings & Preferences</h2>
          <p className="text-xs text-gray-500 mt-0.5">Control your account, appearance, language translation, safety, and privacy.</p>
        </div>

        {/* 1. User Identity & Account Card */}
        {user && (
          <div className="bg-white rounded-3xl border border-[var(--sc-border)] p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 ${
                  isVerifiedVet ? 'ring-2 ring-offset-2 ring-[var(--sc-brand-500)]' : 'ring-1 ring-gray-200'
                }`}>
                  {user.photoURL || user.photoUrl ? (
                    <img
                      src={user.photoURL || user.photoUrl || undefined}
                      alt={user.displayName || 'User'}
                      onError={avatarOnError}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-gray-400" />
                  )}
                </div>
                {isVerifiedVet && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs">
                    <ShieldCheck size={16} className="text-[var(--sc-brand-500)]" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-[var(--sc-text-primary)] truncate">
                    {user.displayName || 'User'}
                  </h3>
                  {isVerifiedVet && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-lg shrink-0">
                      Verified Vet
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--sc-text-secondary)] truncate">
                  {(user as any).handle ? `@${(user as any).handle}` : user.email}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-2 bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-100)] rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95"
            >
              Edit Profile
            </button>
          </div>
        )}

        {/* 2. Account Security & Login Credentials */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[12px] sm:text-[13px] font-bold text-[var(--sc-text-secondary)] uppercase tracking-wider pl-2">
            Account & Security
          </h3>

          <div className="bg-white rounded-2xl border border-[var(--sc-border)] overflow-hidden shadow-xs divide-y divide-[var(--sc-border)]">
            {/* Email Display */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-50 text-[var(--sc-brand-600)]">
                  <Mail size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Primary Email</span>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                </div>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                Active & Verified
              </span>
            </div>

            {/* Password & Security Modal Trigger */}
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-50 text-[var(--sc-brand-600)]">
                  <Key size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Password & Credentials</span>
                  <span className="text-xs text-gray-500">Dispatch secure password reset link or update credentials</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-[var(--sc-brand-600)] transition-colors shrink-0" />
            </button>
          </div>
        </div>

        {/* 3. Appearance & Theme Settings */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[12px] sm:text-[13px] font-bold text-[var(--sc-text-secondary)] uppercase tracking-wider pl-2">
            Appearance & Themes
          </h3>

          <div className="bg-white rounded-2xl border border-[var(--sc-border)] overflow-hidden shadow-xs divide-y divide-[var(--sc-border)]">
            {/* Theme Selector */}
            <div className="p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Sun size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Color Theme</span>
                    <span className="text-xs text-gray-500">Select your preferred interface display mode</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600 capitalize bg-blue-50 px-2.5 py-1 rounded-lg">
                  {prefs.theme === 'light' ? 'Light Mode' : prefs.theme === 'dark' ? 'Dark Mode' : 'System Match'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-[var(--sc-border)] text-xs font-bold">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    prefs.theme === 'light'
                      ? 'bg-[var(--sc-brand-600)] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  <Sun size={14} /> Light
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    prefs.theme === 'dark'
                      ? 'bg-[var(--sc-brand-600)] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  <Moon size={14} /> Dark
                </button>
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    prefs.theme === 'system'
                      ? 'bg-[var(--sc-brand-600)] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  <Monitor size={14} /> System
                </button>
              </div>
            </div>

            {/* Accessibility Font Size Toggle */}
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Type size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Accessibility Text Size</span>
                  <span className="text-xs text-gray-500">Standard readable vs. enlarged touch-friendly typography</span>
                </div>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl border border-[var(--sc-border)] text-xs font-bold">
                <button
                  onClick={() => handleFontSizeChange('normal')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    prefs.fontSize === 'normal'
                      ? 'bg-[var(--sc-brand-600)] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => handleFontSizeChange('large')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    prefs.fontSize === 'large'
                      ? 'bg-[var(--sc-brand-600)] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Large
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Language & Global Translation */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[12px] sm:text-[13px] font-bold text-[var(--sc-text-secondary)] uppercase tracking-wider pl-2">
            Language & Global Translation
          </h3>

          <div className="bg-white rounded-2xl border border-[var(--sc-border)] p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <Globe size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Global Translation Plugin</span>
                  <span className="text-xs text-gray-500">Translate the StrayCare portal into local languages</span>
                </div>
              </div>
            </div>

            {/* Quick Language Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {LANGUAGES.map((lang) => {
                const isSelected = prefs.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all text-left ${
                      isSelected
                        ? 'bg-[var(--sc-brand-50)] text-[var(--sc-brand-700)] border-[var(--sc-brand-300)] ring-1 ring-[var(--sc-brand-300)]'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-[var(--sc-border)]'
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span className="truncate">{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. Veterinary & Practitioner Credentials */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[12px] sm:text-[13px] font-bold text-[var(--sc-text-secondary)] uppercase tracking-wider pl-2">
            Veterinary & Professional Status
          </h3>

          <div className="bg-white rounded-2xl border border-[var(--sc-border)] overflow-hidden shadow-xs">
            <button
              onClick={() => setIsVetModalOpen(true)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-50 text-green-700">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[14px] text-[var(--sc-text-primary)]">Veterinary Practitioner Credential</span>
                    {isVerifiedVet && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <Check size={12} /> Certified & Active
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {isVerifiedVet
                      ? 'View your official license credentials, badges, and verified practitioner privileges.'
                      : 'Apply to receive the verified practitioner badge and medical advisory privileges.'}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-[var(--sc-brand-600)] transition-colors shrink-0" />
            </button>
          </div>
        </div>

        {/* 6. Privacy, Location & Safety Autonomy */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[12px] sm:text-[13px] font-bold text-[var(--sc-text-secondary)] uppercase tracking-wider pl-2">
            Privacy & Rescuer Safety
          </h3>

          <div className="bg-white rounded-2xl border border-[var(--sc-border)] overflow-hidden shadow-xs divide-y divide-[var(--sc-border)]">
            {/* Location Precision Controls */}
            <div className="p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-50 text-[var(--sc-brand-600)]">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Location Precision Mode</span>
                    <span className="text-xs text-gray-500">Protect your exact address when creating rescue posts</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[var(--sc-brand-600)] capitalize bg-purple-50 px-2.5 py-1 rounded-lg">
                  {prefs.locationPrivacy === 'precise' ? 'Exact GPS' : prefs.locationPrivacy === 'city' ? 'City Only' : 'Hidden'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-[var(--sc-border)] text-xs font-bold">
                <button
                  onClick={() => handleLocationChange('precise')}
                  className={`py-2 rounded-lg transition-all ${
                    prefs.locationPrivacy === 'precise'
                      ? 'bg-[var(--sc-brand-600)] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  GPS Exact
                </button>
                <button
                  onClick={() => handleLocationChange('city')}
                  className={`py-2 rounded-lg transition-all ${
                    prefs.locationPrivacy === 'city'
                      ? 'bg-[var(--sc-brand-600)] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  City Only
                </button>
                <button
                  onClick={() => handleLocationChange('hidden')}
                  className={`py-2 rounded-lg transition-all ${
                    prefs.locationPrivacy === 'hidden'
                      ? 'bg-[var(--sc-brand-600)] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  Off (Hidden)
                </button>
              </div>
            </div>

            {/* Blur Sensitive Media Switch */}
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  {prefs.blurSensitiveMedia ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Blur Sensitive Graphic Animal Media</span>
                  <span className="text-xs text-gray-500">Require a tap to reveal injured animal rescue photos</span>
                </div>
              </div>

              <button
                onClick={toggleBlurSensitive}
                role="switch"
                aria-checked={prefs.blurSensitiveMedia}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  prefs.blurSensitiveMedia ? 'bg-[var(--sc-brand-600)]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    prefs.blurSensitiveMedia ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Who Can Message You */}
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Direct Message Permissions</span>
                  <span className="text-xs text-gray-500">Allow chats from all users or established connections only</span>
                </div>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl border border-[var(--sc-border)] text-xs font-bold">
                <button
                  onClick={() => handleMessagePrivacyChange('anyone')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    prefs.whoCanMessage === 'anyone'
                      ? 'bg-[var(--sc-brand-600)] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Anyone
                </button>
                <button
                  onClick={() => handleMessagePrivacyChange('connections')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    prefs.whoCanMessage === 'connections'
                      ? 'bg-[var(--sc-brand-600)] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Connections
                </button>
              </div>
            </div>

            {/* Blocked Users Manager Trigger */}
            <button
              onClick={() => setIsBlockedModalOpen(true)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Blocked Accounts & Reports</span>
                  <span className="text-xs text-gray-500">Manage blocked users and content moderation safety</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-[var(--sc-brand-600)] transition-colors shrink-0" />
            </button>
          </div>
        </div>

        {/* 7. Detailed Notification Preferences */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[12px] sm:text-[13px] font-bold text-[var(--sc-text-secondary)] uppercase tracking-wider pl-2">
            Notification Preferences
          </h3>

          <div className="bg-white rounded-2xl border border-[var(--sc-border)] overflow-hidden shadow-xs divide-y divide-[var(--sc-border)]">
            {/* Emergency Alerts */}
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <Bell size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Emergency Rescue Push Notices</span>
                  <span className="text-xs text-gray-500">Instant alerts when stray animals need urgent rescue nearby</span>
                </div>
              </div>

              <button
                onClick={toggleEmergencyAlerts}
                role="switch"
                aria-checked={prefs.emergencyAlerts}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  prefs.emergencyAlerts ? 'bg-[var(--sc-brand-600)]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    prefs.emergencyAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Post Interactions */}
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-50 text-[var(--sc-brand-600)]">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Comments & Interaction Alerts</span>
                  <span className="text-xs text-gray-500">Notices when community members reply or like your cases</span>
                </div>
              </div>

              <button
                onClick={togglePostAlerts}
                role="switch"
                aria-checked={prefs.postInteractionAlerts}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  prefs.postInteractionAlerts ? 'bg-[var(--sc-brand-600)]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    prefs.postInteractionAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Fundraiser Donations */}
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <HeartHandshake size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Fundraiser Donation Receipts</span>
                  <span className="text-xs text-gray-500">Receive real-time notices for campaign contributions</span>
                </div>
              </div>

              <button
                onClick={toggleDonationAlerts}
                role="switch"
                aria-checked={prefs.donationAlerts}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  prefs.donationAlerts ? 'bg-[var(--sc-brand-600)]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    prefs.donationAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Email Notifications */}
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Smartphone size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Weekly Community Email Digest</span>
                  <span className="text-xs text-gray-500">Summary of rescues and community milestones</span>
                </div>
              </div>

              <button
                onClick={toggleEmailAlerts}
                role="switch"
                aria-checked={prefs.emailAlerts}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  prefs.emailAlerts ? 'bg-[var(--sc-brand-600)]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    prefs.emailAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 8. Legal, Community Standards & Help Center */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[12px] sm:text-[13px] font-bold text-[var(--sc-text-secondary)] uppercase tracking-wider pl-2">
            Legal & Support
          </h3>

          <div className="bg-white rounded-2xl border border-[var(--sc-border)] overflow-hidden shadow-xs divide-y divide-[var(--sc-border)]">
            <button
              onClick={() => setPolicyModalType('terms')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-100 text-gray-600">
                  <FileText size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Terms of Service</span>
                  <span className="text-xs text-gray-500">Read our platform usage agreement and rescue standards</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-[var(--sc-brand-600)] transition-colors shrink-0" />
            </button>

            <button
              onClick={() => setPolicyModalType('privacy')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-100 text-gray-600">
                  <Shield size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Privacy Policy</span>
                  <span className="text-xs text-gray-500">How we protect your individual data and location autonomy</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-[var(--sc-brand-600)] transition-colors shrink-0" />
            </button>

            <button
              onClick={() => setPolicyModalType('community')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-100 text-gray-600">
                  <HeartHandshake size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Community Rescue Guidelines</span>
                  <span className="text-xs text-gray-500">Best practices for humane handling and fundraising accountability</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-[var(--sc-brand-600)] transition-colors shrink-0" />
            </button>

            <button
              onClick={() => setPolicyModalType('support')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-100 text-gray-600">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Help Center & Support</span>
                  <span className="text-xs text-gray-500">24/7 clinic emergency hotline and developer assistance</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-[var(--sc-brand-600)] transition-colors shrink-0" />
            </button>
          </div>
        </div>

        {/* 9. Data Freedom & Danger Zone */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[12px] sm:text-[13px] font-bold text-[var(--sc-text-secondary)] uppercase tracking-wider pl-2">
            Data Freedom & Account Management
          </h3>

          <div className="bg-white rounded-2xl border border-[var(--sc-border)] overflow-hidden shadow-xs divide-y divide-[var(--sc-border)]">
            {/* Export Data */}
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Download size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Download My Data Archive (JSON)</span>
                  <span className="text-xs text-gray-500">Export your posts, credentials, and activity record</span>
                </div>
              </div>
              {dataExported ? (
                <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                  <Check size={14} /> Downloaded
                </span>
              ) : (
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[var(--sc-brand-600)] transition-colors shrink-0" />
              )}
            </button>

            {/* Logout */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-red-50/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <LogOut size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-red-600 block">Sign Out</span>
                  <span className="text-xs text-gray-500">End your current session securely on this device</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-red-300 group-hover:text-red-600 transition-colors shrink-0" />
            </button>

            {/* Delete Account */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-red-50/70 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-100 text-red-700">
                  <Trash2 size={18} />
                </div>
                <div>
                  <span className="font-bold text-[14px] text-red-700 block">Deactivate / Delete Account</span>
                  <span className="text-xs text-gray-500">Permanently remove your account and rescue posts</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-red-400 group-hover:text-red-700 transition-colors shrink-0" />
            </button>
          </div>
        </div>

      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* Vet Verification Credential Modal */}
      {isVetModalOpen && user && (
        <VetVerificationModal
          isOpen={isVetModalOpen}
          onClose={() => setIsVetModalOpen(false)}
          userId={user.uid}
          email={user.email}
          displayName={user.displayName}
        />
      )}

      {/* Password & Security Modal */}
      {isPasswordModalOpen && (
        <PasswordSecurityModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}

      {/* Blocked Users Modal */}
      {isBlockedModalOpen && (
        <BlockedUsersModal
          isOpen={isBlockedModalOpen}
          onClose={() => setIsBlockedModalOpen(false)}
        />
      )}

      {/* Legal & Policy Modals */}
      {policyModalType && (
        <PolicyModal
          type={policyModalType}
          onClose={() => setPolicyModalType(null)}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-white rounded-3xl p-5 sm:p-6 w-full max-w-xs text-center border border-[var(--sc-border)] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <LogOut size={18} />
            </div>
            <h3 className="font-bold text-base text-[var(--sc-text-primary)]">Log out of StrayCare?</h3>
            <p className="text-xs text-gray-500 mt-1">You will need to sign in again to access your rescues and posts.</p>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-[var(--sc-border)] font-bold text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  logout();
                  setShowLogoutConfirm(false);
                }}
                className="flex-1 py-2 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 shadow-xs"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-3xl p-5 sm:p-6 w-full max-w-sm text-center border border-[var(--sc-border)] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={22} />
            </div>
            <h3 className="font-bold text-base text-[var(--sc-text-primary)]">Delete StrayCare Account?</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              This action is permanent. All your posts, animal rescue cases, and connections will be permanently removed.
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--sc-border)] font-bold text-xs hover:bg-gray-50"
              >
                Keep Account
              </button>
              <button
                onClick={() => {
                  logout();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
