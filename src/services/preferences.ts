export type UserPreferences = {
  locationPrivacy: 'precise' | 'city' | 'hidden';
  blurSensitiveMedia: boolean;
  theme: 'light' | 'dark' | 'system';
  emergencyAlerts: boolean;
  defaultFeedTab: 'explore' | 'nearby';
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  locationPrivacy: 'city',
  blurSensitiveMedia: false,
  theme: 'light',
  emergencyAlerts: true,
  defaultFeedTab: 'explore',
};

export const getStoredPreferences = (): UserPreferences => {
  try {
    const raw = localStorage.getItem('straycare_user_preferences');
    if (raw) return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_PREFERENCES;
};

export const savePreferences = (prefs: Partial<UserPreferences>): UserPreferences => {
  const current = getStoredPreferences();
  const updated = { ...current, ...prefs };
  try {
    localStorage.setItem('straycare_user_preferences', JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
  window.dispatchEvent(new CustomEvent('straycare:preferences-changed', { detail: updated }));
  return updated;
};
