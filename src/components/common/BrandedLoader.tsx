import React from 'react';
import { useLottie } from 'lottie-react';
import rippleAnimation from '../../assets/animations/Twitch-Brand-ripple-pop.nowatermark.json';

interface BrandedLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg' | number;
}

function PureLottie({ dim }: { dim: number }) {
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
    <div className="flex items-center justify-center pointer-events-none select-none overflow-visible">
      {View}
    </div>
  );
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

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[var(--sc-bg,#ffffff)]">
        <PureLottie dim={dim} />
      </div>
    );
  }

  return <PureLottie dim={dim} />;
}
