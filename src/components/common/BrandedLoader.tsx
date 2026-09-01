import React from 'react';
import { Lottie } from 'lottie-react';
import rippleAnimation from '../../assets/animations/Twitch-Brand-ripple-pop.nowatermark.json';

interface BrandedLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg' | number;
}

export default function BrandedLoader({
  fullScreen = false,
  size = 'md',
}: BrandedLoaderProps) {
  const getDimension = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm':
        return 120;
      case 'lg':
        return 320;
      case 'md':
      default:
        return fullScreen ? 260 : 160;
    }
  };

  const dim = getDimension();

  const content = (
    <div
      style={{ width: `${dim}px`, height: `${dim}px` }}
      className="flex items-center justify-center pointer-events-none select-none"
    >
      <Lottie
        animationData={rippleAnimation}
        loop={true}
        autoplay={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[var(--sc-bg,#ffffff)]">
        {content}
      </div>
    );
  }

  return content;
}
