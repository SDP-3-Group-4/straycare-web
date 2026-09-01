export type UserPreferences = {
  locationPrivacy: "precise" | "city" | "hidden";
  blurSensitiveMedia: boolean;
  theme: "light" | "dark" | "system";
  language: string;
  fontSize: "normal" | "large";
  emergencyAlerts: boolean;
  postInteractionAlerts: boolean;
  donationAlerts: boolean;
  emailAlerts: boolean;
  whoCanMessage: "anyone" | "connections";
  defaultFeedTab: "explore" | "nearby";
  useHyperID: boolean;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  locationPrivacy: "city",
  blurSensitiveMedia: false,
  theme: "light",
  language: "en",
  fontSize: "normal",
  emergencyAlerts: true,
  postInteractionAlerts: true,
  donationAlerts: true,
  emailAlerts: true,
  whoCanMessage: "anyone",
  defaultFeedTab: "explore",
  useHyperID: true,
};

export const applyThemeDOM = (theme: "light" | "dark" | "system") => {
  try {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (e) {
    console.error(e);
  }
};

export const applyFontSizeDOM = (fontSize: "normal" | "large") => {
  try {
    if (fontSize === "large") {
      document.documentElement.classList.add("text-scale-lg");
    } else {
      document.documentElement.classList.remove("text-scale-lg");
    }
  } catch (e) {
    console.error(e);
  }
};

export const applyLanguageTranslation = (langCode: string) => {
  try {
    // Set google translate cookie for persistence
    document.cookie = `googtrans=/en/${langCode}; path=/;`;
    const select = document.querySelector(
      ".goog-te-combo",
    ) as HTMLSelectElement | null;
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event("change"));
    }
  } catch (e) {
    console.error(e);
  }
};

export const getStoredPreferences = (): UserPreferences => {
  try {
    const raw = localStorage.getItem("straycare_user_preferences");
    if (raw) return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_PREFERENCES;
};

export const initPreferencesDOM = () => {
  const prefs = getStoredPreferences();
  applyThemeDOM(prefs.theme);
  applyFontSizeDOM(prefs.fontSize);
};

export const savePreferences = (
  prefs: Partial<UserPreferences>,
): UserPreferences => {
  const current = getStoredPreferences();
  const updated = { ...current, ...prefs };
  try {
    localStorage.setItem("straycare_user_preferences", JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }

  if (prefs.theme) {
    applyThemeDOM(prefs.theme);
  }
  if (prefs.fontSize) {
    applyFontSizeDOM(prefs.fontSize);
  }
  if (prefs.language) {
    applyLanguageTranslation(prefs.language);
  }

  window.dispatchEvent(
    new CustomEvent("straycare:preferences-changed", { detail: updated }),
  );
  return updated;
};

// Initialize DOM attributes on load
if (typeof window !== "undefined") {
  initPreferencesDOM();
}
