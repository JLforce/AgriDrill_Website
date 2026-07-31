"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 500;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Animates from the previous value to `target` over ~500ms whenever `target` changes. */
export function useAnimatedNumber(target: number): number {
  const [displayValue, setDisplayValue] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const startTime = performance.now();

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    function step(now: number) {
      const progress = Math.min(1, (now - startTime) / DURATION_MS);
      const eased = easeOutCubic(progress);
      setDisplayValue(from + (target - from) * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    }

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return displayValue;
}