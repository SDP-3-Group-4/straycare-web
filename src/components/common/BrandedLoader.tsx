import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";
import rippleAnimation from "../../assets/animations/Twitch-Brand-ripple-pop.nowatermark.json";

interface BrandedLoaderProps {
  fullScreen?: boolean;
}

export default function BrandedLoader({
  fullScreen = false,
}: BrandedLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current) {
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: rippleAnimation,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid slice",
        },
      });
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
      }
    };
  }, []);

  const content = (
    <div
      ref={containerRef}
      className="flex items-center justify-center pointer-events-none select-none"
      style={{
        width: fullScreen ? "260px" : "160px",
        height: fullScreen ? "260px" : "160px",
      }}
    />
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
