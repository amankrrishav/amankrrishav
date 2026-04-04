"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, type ReactNode } from "react";
import { useUniverse } from "@/stores/useUniverse";

export default function LenisProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.08,
        duration: 1.4,
        smoothWheel: true,
        syncTouch: true,
      }}
    >
      <LenisSync />
      {children}
    </ReactLenis>
  );
}

/**
 * Inner component that syncs Lenis scroll progress to Zustand store
 * and stores the Lenis instance reference for boot sequence control.
 */
function LenisSync() {
  const setScrollProgress = useUniverse((s) => s.setScrollProgress);
  const setLenisRef = useUniverse((s) => s.setLenisRef);

  useLenis((lenis) => {
    const total = lenis.limit; // max scroll distance
    if (total > 0) {
      setScrollProgress(lenis.animatedScroll / total);
    }
  });

  // Store Lenis reference on mount for boot sequence scroll locking
  useLenis((lenis) => {
    setLenisRef({
      stop: () => lenis.stop(),
      start: () => lenis.start(),
    });
  });

  // Lock scroll initially (boot sequence will unlock it)
  useEffect(() => {
    const timer = setTimeout(() => {
      const lenisRef = useUniverse.getState().lenisRef;
      if (lenisRef) {
        lenisRef.stop();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
