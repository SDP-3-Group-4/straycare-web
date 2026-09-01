import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";

interface HeaderLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function HeaderLogo({ className, style }: HeaderLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (containerRef.current) {
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: false,
        autoplay: true,
        path: "/headerLogo.json?v=2",
        rendererSettings: {
          preserveAspectRatio: "xMinYMid slice",
          className: "overflow-visible", // Prevent Lottie from clipping bounces
        },
      });

      const handleComplete = () => {
        timeoutId = setTimeout(() => {
          if (animRef.current) {
            animRef.current.goToAndPlay(0, true);
          }
        }, 60000);
      };

      animRef.current.addEventListener("complete", handleComplete);
    }

    return () => {
      clearTimeout(timeoutId);
      if (animRef.current) {
        animRef.current.destroy();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`select-none cursor-pointer flex items-center justify-start overflow-visible ${className || ""}`}
      style={style}
    />
  );
}
