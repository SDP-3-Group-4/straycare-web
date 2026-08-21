import { useState, useEffect } from 'react';
import { Smartphone, Monitor, X, ExternalLink, Sparkles } from 'lucide-react';

const ANDROID_WAITLIST_URL = 'https://forms.gle/dCQchSJ98vLdN5K';

export default function MobileBanner() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('sc_mobile_banner_dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('sc_mobile_banner_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="App suggestion banner"
      className="lg:hidden sticky top-0 z-50 w-full bg-gradient-to-r from-[#772BFB] via-[#611ee2] to-[#471995] text-white shadow-md border-b border-purple-400/20 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="max-w-7xl mx-auto px-3 py-2.5 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[13px]">
        {/* Main Text */}
        <div className="flex items-center gap-2 text-center sm:text-left leading-tight">
          <span className="p-1 bg-white/15 rounded-lg shrink-0 flex items-center justify-center">
            <Sparkles size={14} className="text-yellow-300 animate-pulse" />
          </span>
          <p className="font-medium text-white/95 text-xs sm:text-[13px]">
            StrayCare experience is better on{' '}
            <a
              href={window.location.origin}
              className="underline font-bold hover:text-white transition-colors decoration-white/60 hover:decoration-white"
            >
              desktop
            </a>{' '}
            or{' '}
            <a
              href={ANDROID_WAITLIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold hover:text-white transition-colors decoration-white/60 hover:decoration-white"
            >
              android app
            </a>
          </p>
        </div>

        {/* Action Buttons & Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={window.location.origin}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/25 text-white px-2.5 py-1 rounded-full text-xs font-semibold transition-all active:scale-95"
            title="Desktop experience"
          >
            <Monitor size={12} />
            <span>Desktop</span>
          </a>

          <a
            href={ANDROID_WAITLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-white text-[#772BFB] hover:bg-white/95 px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Smartphone size={12} />
            <span>Android App</span>
            <ExternalLink size={10} className="opacity-70" />
          </a>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors ml-0.5"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
