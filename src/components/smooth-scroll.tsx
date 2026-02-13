"use client";

import { ReactNode, useEffect, useRef } from "react";
import Lenis from "lenis";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Pause Lenis when a dialog/modal is open so native scrolling works inside it
    const observer = new MutationObserver(() => {
      const hasDialog = document.querySelector("[role='dialog'], [data-radix-dialog-content]");
      if (hasDialog) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
