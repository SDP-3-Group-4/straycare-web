import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Settings,
  ShieldCheck,
  MapPin,
  Eye,
  EyeOff,
  Bell,
  LogOut,
  ChevronRight,
  BadgeCheck,
  Check,
  X,
  ExternalLink,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { avatarOnError, formatHandle } from '../../constants';
import { getStoredPreferences, savePreferences, type UserPreferences } from '../../services/preferences';
import VetVerificationModal from '../home/feed/VetVerificationModal';
import PaymentMethodsModal from './PaymentMethodsModal';

interface ProfileFlyoutMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileFlyoutMenu({ isOpen, onClose }: ProfileFlyoutMenuProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<UserPreferences>(getStoredPreferences());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [vetModalOpen, setVetModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    const handlePrefsChange = (e: any) => {
      if (e.detail) setPrefs(e.detail);
    };
    window.addEventListener('straycare:preferences-changed', handlePrefsChange);
    return () => window.removeEventListener('straycare:preferences-changed', handlePrefsChange);
  }, []);

  if (!isOpen || !user) return null;

  const isVerifiedVet = Boolean(user.isVet || user.verifiedStatus);

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

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <>
      <div className="fixed inset-0 z-[90] flex items-start justify-end sm:p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        />

        {/* Flyout Popover */}
        <div className="relative z-10 w-full sm:w-96 bg-white rounded-b-3xl sm:rounded-3xl shadow-2xl border border-[var(--sc-border)] flex flex-col overflow-hidden max-h-[92vh] animate-in slide-in-from-top-3 sm:slide-in-from-right-3 duration-200 mt-0 sm:mt-14 mr-0 sm:mr-4">
          
          {/* Header Bar */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-purple-50/40 border-b border-[var(--sc-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] text-[var(--sc-text-primary)]">Quick Settings & Profile</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-200/70 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X size={17} />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex flex-col gap-4">
            
            {/* User Profile Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-[var(--sc-border)] shadow-xs flex items-center gap-3">
              <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 ${
                  isVerifiedVet ? 'ring-2 ring-offset-2 ring-[var(--sc-brand-500)]' : 'ring-1 ring-gray-200'
                }`}>
                  {user.photoUrl ? (
                    <img
                      src={user.photoUrl || undefined}
                      alt={user.displayName || 'User'}
                      onError={avatarOnError}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={22} className="text-gray-400" />
                  )}
                </div>
                {isVerifiedVet && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs">
                    <BadgeCheck size={14} className="text-[var(--sc-brand-500)]" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-[14px] text-[var(--sc-text-primary)] truncate notranslate" translate="no">
                    {user.displayName || 'User'}
                  </h4>
                  {isVerifiedVet && (
                    <span className="px-1.5 py-0.2 bg-green-100 text-green-700 text-[9px] font-bold uppercase tracking-wider rounded-md shrink-0">
                      Vet
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--sc-text-secondary)] truncate notranslate" translate="no">
                  {(user as any).handle ? formatHandle((user as any).handle) : user.email}
                </p>
              </div>

              <Link
                to="/profile"
                onClick={onClose}
                className="px-2.5 py-1.5 bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-100)] rounded-xl text-xs font-bold shrink-0 transition-colors"
              >
                View
              </Link>
            </div>

            {/* Inline Interactive Settings Section */}
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold text-[var(--sc-text-secondary)] uppercase tracking-wider pl-1">
                Personalized Controls
              </span>

              {/* Location Privacy Control */}
              <div className="p-3 bg-gray-50/80 rounded-2xl border border-[var(--sc-border)] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-[var(--sc-brand-600)]" />
                    <span className="text-xs font-bold text-[var(--sc-text-primary)]">Location Privacy</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium capitalize">
                    {prefs.locationPrivacy === 'precise' ? 'GPS Exact' : prefs.locationPrivacy === 'city' ? 'City Only' : 'Hidden'}
                  </span>
                </div>
                
                {/* Segmented Control */}
                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-[var(--sc-border)] text-center text-xs font-bold">
                  <button
                    onClick={() => handleLocationChange('precise')}
                    className={`py-1 rounded-lg transition-all ${
                      prefs.locationPrivacy === 'precise'
                        ? 'bg-[var(--sc-brand-600)] text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    GPS
                  </button>
                  <button
                    onClick={() => handleLocationChange('city')}
                    className={`py-1 rounded-lg transition-all ${
                      prefs.locationPrivacy === 'city'
                        ? 'bg-[var(--sc-brand-600)] text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    City
                  </button>
                  <button
                    onClick={() => handleLocationChange('hidden')}
                    className={`py-1 rounded-lg transition-all ${
                      prefs.locationPrivacy === 'hidden'
                        ? 'bg-[var(--sc-brand-600)] text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Off
                  </button>
                </div>
              </div>

              {/* Blur Sensitive Graphic Media Toggle */}
              <div className="p-3 bg-gray-50/80 rounded-2xl border border-[var(--sc-border)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {prefs.blurSensitiveMedia ? (
                    <EyeOff size={16} className="text-amber-600 shrink-0" />
                  ) : (
                    <Eye size={16} className="text-gray-500 shrink-0" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[var(--sc-text-primary)] truncate">Blur Sensitive Injury Media</span>
                    <span className="text-[10px] text-gray-500">Tap to reveal graphic rescue posts</span>
                  </div>
                </div>

                <button
                  onClick={toggleBlurSensitive}
                  role="switch"
                  aria-checked={prefs.blurSensitiveMedia}
                  className={`w-10 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                    prefs.blurSensitiveMedia ? 'bg-[var(--sc-brand-600)]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      prefs.blurSensitiveMedia ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Emergency Local Rescue Alerts Toggle */}
              <div className="p-3 bg-gray-50/80 rounded-2xl border border-[var(--sc-border)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Bell size={16} className="text-[var(--sc-brand-600)] shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[var(--sc-text-primary)] truncate">Emergency Rescue Alerts</span>
                    <span className="text-[10px] text-gray-500">Instant notices for nearby animals</span>
                  </div>
                </div>

                <button
                  onClick={toggleEmergencyAlerts}
                  role="switch"
                  aria-checked={prefs.emergencyAlerts}
                  className={`w-10 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                    prefs.emergencyAlerts ? 'bg-[var(--sc-brand-600)]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      prefs.emergencyAlerts ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-[var(--sc-text-secondary)] uppercase tracking-wider pl-1">
                Account & Preferences
              </span>

              {/* Vet Badge Entry */}
              <button
                onClick={() => setVetModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-[var(--sc-border)] text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-green-50 text-green-700">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--sc-text-primary)]">Veterinary Verification</span>
                    <span className="text-[11px] text-gray-500">
                      {isVerifiedVet ? 'Status: Verified Practitioner' : 'Apply for Official Badge'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={15} className="text-gray-400 group-hover:text-gray-700" />
              </button>

              {/* Payment Methods & Wallet Entry */}
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-[var(--sc-border)] text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-pink-50 text-pink-600">
                    <CreditCard size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--sc-text-primary)]">Payment Methods & Wallet</span>
                    <span className="text-[11px] text-gray-500">
                      bKash, Nagad & Cards for donations
                    </span>
                  </div>
                </div>
                <ChevronRight size={15} className="text-gray-400 group-hover:text-gray-700" />
              </button>

              {/* Full Settings Page Link */}
              <Link
                to="/settings"
                onClick={onClose}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-[var(--sc-border)] text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)]">
                    <Settings size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--sc-text-primary)]">All Settings & Privacy</span>
                    <span className="text-[11px] text-gray-500">Password, identity & data export</span>
                  </div>
                </div>
                <ChevronRight size={15} className="text-gray-400 group-hover:text-[var(--sc-brand-600)]" />
              </Link>
            </div>

            {/* Logout Action */}
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>

          </div>
        </div>
      </div>

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
                onClick={handleLogout}
                className="flex-1 py-2 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 shadow-xs"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vet Verification Modal */}
      {vetModalOpen && (
        <VetVerificationModal
          isOpen={vetModalOpen}
          onClose={() => setVetModalOpen(false)}
          userId={user.uid}
          email={user.email}
          displayName={user.displayName}
        />
      )}

      {/* Payment Methods Modal */}
      {paymentModalOpen && (
        <PaymentMethodsModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
        />
      )}
    </>
  );
}
