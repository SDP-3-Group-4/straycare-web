import React, { useState, useEffect } from 'react';
import { useLottie } from 'lottie-react';
import rippleAnimation from '../../assets/animations/loading-ripple.json';
import logoSvg from '../../assets/logo.svg';

interface BrandedLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg' | number;
  message?: string;
  showTagline?: boolean;
}

const COLD_START_MESSAGES = [
  'Warming up StrayCare network...',
  'Connecting rescue volunteers...',
  'Loading community updates...',
  'Almost ready to care...',
];

function LottieAnimation({ dim }: { dim: number }) {
  const options = {
    animationData: rippleAnimation,
    loop: true,
    autoplay: true,
  };

  const { View } = useLottie(options, {
    width: dim,
    height: dim,
  });

  return (
    <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
      {View}
      {/* Floating Brand Logo Badge in Center */}
      <div className="absolute inset-0 m-auto w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-[var(--sc-border)] shadow-md flex items-center justify-center p-2 z-10 transition-transform duration-300 hover:scale-105">
        <img src={logoSvg} alt="StrayCare" className="w-full h-full object-contain" />
      </div>
    </div>
  );
}

export default function BrandedLoader({
  fullScreen = false,
  size = 'md',
  message,
  showTagline = true,
}: BrandedLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!fullScreen) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % COLD_START_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [fullScreen]);

  const getDimension = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm':
        return 72;
      case 'lg':
        return 200;
      case 'md':
      default:
        return 130;
    }
  };

  const dim = getDimension();
  const currentMessage = message ?? (fullScreen ? COLD_START_MESSAGES[messageIndex] : 'Loading...');

  const content = (
    <div className="flex flex-col items-center justify-center select-none text-center animate-in fade-in duration-300">
      <LottieAnimation dim={dim} />

      {/* Message and Subtext */}
      {showTagline && (
        <div className="mt-3.5 flex flex-col items-center">
          <p className="text-[13px] sm:text-[14px] font-bold text-[var(--sc-text-primary)] tracking-tight transition-all duration-300">
            {currentMessage}
          </p>
          {fullScreen && (
            <p className="text-[11px] text-[var(--sc-text-secondary)] mt-1 font-medium opacity-80 animate-pulse">
              StrayCare • Rescuing & Caring for Community Animals
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[var(--sc-bg,#f8fafc)] dark:bg-zinc-950 transition-colors duration-300">
        {/* Subtle glowing ambient gradient backdrop */}
        <div className="absolute w-72 h-72 rounded-full bg-[var(--sc-brand-500)] opacity-10 blur-3xl pointer-events-none -translate-y-6" />
        {content}
      </div>
    );
  }

  return content;
}
