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
        loop: false, // We'll handle the looping manually
        autoplay: true,
        path: "/headerLogo.json", // Fetched from public/
        rendererSettings: {
          preserveAspectRatio: "xMinYMid meet",
        },
      });

      animRef.current.addEventListener("DOMLoaded", () => {
        if (containerRef.current) {
          const svg = containerRef.current.querySelector("svg");
          if (svg) {
            // The original Lottie is 1280x720 (16:9), but the actual text is in the center.
            // Original SVG logo was 385x81 (aspect ratio ~4.75).
            // To match 4.75 aspect ratio for 1280 width, height should be ~270.
            // Y-offset to center: (720 - 270) / 2 = 225.
            // This crops out the massive transparent top/bottom margins perfectly!
            svg.setAttribute("viewBox", "0 225 1280 270");
          }
        }
      });

      const handleComplete = () => {
        // Freeze on last frame for 1 minute (60,000 ms), then reset and play
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
      className={`select-none cursor-pointer ${className || ""}`}
      style={{
        aspectRatio: "385 / 81",
        ...style,
      }}
    />
  );
}
