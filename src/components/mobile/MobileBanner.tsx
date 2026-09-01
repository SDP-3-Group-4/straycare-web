import { useState } from "react";
import { Smartphone, Monitor, X, ExternalLink } from "lucide-react";
import bannerBrandingIcon from "../../assets/banner_branding.svg";

const ANDROID_WAITLIST_URL = "https://forms.gle/T8di6jGPrGnk8Qbr6";

export default function MobileBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <aside
      aria-label="App suggestion banner"
      className="lg:hidden sticky top-0 z-50 w-full bg-gradient-to-r from-[#772BFB] via-[#611ee2] to-[#471995] text-white shadow-md border-b border-purple-400/20 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-3 py-2 sm:px-4 flex flex-wrap items-center justify-between gap-1.5 text-[12px] sm:text-[13px]">
        {/* Main Text */}
        <div className="flex items-center gap-2 leading-tight flex-1 min-w-[200px]">
          <span className="p-1 bg-white/15 rounded-lg shrink-0 flex items-center justify-center">
            <img
              src={bannerBrandingIcon}
              alt="StrayCare Brand Icon"
              className="h-4 w-auto object-contain"
            />
          </span>
          <p className="font-medium text-white/95 text-xs">
            StrayCare experience is better on{" "}
            <a
              href={window.location.origin}
              className="underline font-bold hover:text-white transition-colors"
            >
              desktop
            </a>{" "}
            or{" "}
            <a
              href={ANDROID_WAITLIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold hover:text-white transition-colors"
            >
              android app
            </a>
          </p>
        </div>

        {/* Action Buttons & Dismiss */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <a
            href={window.location.origin}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/25 text-white px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
            title="Desktop experience"
          >
            <Monitor size={11} />
            <span>Desktop</span>
          </a>

          <a
            href={ANDROID_WAITLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-white text-[#772BFB] hover:bg-white/95 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs transition-all active:scale-95"
          >
            <Smartphone size={11} />
            <span>Android App</span>
            <ExternalLink size={9} className="opacity-70" />
          </a>

          <button
            onClick={() => setIsVisible(false)}
            aria-label="Dismiss banner"
            className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors ml-0.5"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
