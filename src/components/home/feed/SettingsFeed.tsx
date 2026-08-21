import { useState, useEffect } from 'react';
import {
  User, Mail, Key, Bell, Moon, Globe,
  ShieldAlert, EyeOff, Eye, FileText, HelpCircle, ChevronRight,
  LogOut, ShieldCheck, MapPin, Download, Check, Sparkles, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { avatarOnError } from '../../../constants';
import { getStoredPreferences, savePreferences, type UserPreferences } from '../../../services/preferences';
import EditProfileModal from './EditProfileModal';
import VetVerificationModal from './VetVerificationModal';

export default function SettingsFeed() {
  const { user, logout } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences>(getStoredPreferences());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVetModalOpen, setIsVetModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  const toggleBlurSensitive = () => {
    const updated = savePreferences({ blurSensitiveMedia: !prefs.blurSensitiveMedia });
    setPrefs(updated);
  };

  const toggleEmergencyAlerts = () => {
    const updated = savePreferences({ emergencyAlerts: !prefs.emergencyAlerts });
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
        
        <div className="flex items-center justify-between px-2 sm:px-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--sc-text-primary)]">Settings & Preferences</h2>
            <p className="text-xs text-gray-500 mt-0.5">Control your identity, rescuer privacy, and personal feed experience.</p>
          </div>
        </div>

        {/* User Identity Profile Card */}
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

        {/* Section: Privacy & Location Autonomy */}
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
                    <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Location Precision</span>
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
                  GPS Coordinates
                </button>
                <button
                  onClick={() => handleLocationChange('city')}
                  className={`py-2 rounded-lg transition-all ${
                    prefs.locationPrivacy === 'city'
                      ? 'bg-[var(--sc-brand-600)] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  City / Area Only
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
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Blur Graphic Animal Media</span>
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
          </div>
        </div>

        {/* Section: Verification & Professional Status */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[12px] sm:text-[13px] font-bold text-[var(--sc-text-secondary)] uppercase tracking-wider pl-2">
            Verification & Roles
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
                    <span className="font-bold text-[14px] text-[var(--sc-text-primary)]">Veterinary Verification Badge</span>
                    {isVerifiedVet && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-md">Verified</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {isVerifiedVet
                      ? 'You are a certified veterinary practitioner on StrayCare.'
                      : 'Apply to receive the verified practitioner badge and medical advisory privileges.'}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-[var(--sc-brand-600)] transition-colors shrink-0" />
            </button>
          </div>
        </div>

        {/* Section: Notification Preferences */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[12px] sm:text-[13px] font-bold text-[var(--sc-text-secondary)] uppercase tracking-wider pl-2">
            Notifications & Alerts
          </h3>

          <div className="bg-white rounded-2xl border border-[var(--sc-border)] overflow-hidden shadow-xs divide-y divide-[var(--sc-border)]">
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
          </div>
        </div>

        {/* Section: Data Autonomy & Danger Zone */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[12px] sm:text-[13px] font-bold text-[var(--sc-text-secondary)] uppercase tracking-wider pl-2">
            Data Freedom & Account
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
                  <span className="font-bold text-[14px] text-[var(--sc-text-primary)] block">Download My Data (JSON)</span>
                  <span className="text-xs text-gray-500">Export your profile info, preferences, and activity history</span>
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
                  <span className="text-xs text-gray-500">End your current session on this device</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-red-300 group-hover:text-red-600 transition-colors shrink-0" />
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

      {/* Vet Verification Modal */}
      {isVetModalOpen && user && (
        <VetVerificationModal
          isOpen={isVetModalOpen}
          onClose={() => setIsVetModalOpen(false)}
          userId={user.uid}
          email={user.email}
          displayName={user.displayName}
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
    </div>
  );
}
