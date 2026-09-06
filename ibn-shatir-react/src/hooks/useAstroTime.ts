import { useState, useEffect, useRef, useCallback } from 'react';

export function useAstroTime() {
  const [simDate, setSimDate] = useState<Date>(new Date());
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timeSpeed, setTimeSpeed] = useState<number>(30.0); // يوماً في الثانية
  const lastFrameTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number | null>(null);

  // تحديث محرك الزمن
  useEffect(() => {
    lastFrameTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dtSec = (now - lastFrameTimeRef.current) / 1000.0;
      lastFrameTimeRef.current = now;

      if (isPlaying && dtSec > 0 && dtSec < 0.5) {
        setSimDate((prev) => {
          const addedMs = dtSec * timeSpeed * 86400.0 * 1000.0;
          return new Date(prev.getTime() + addedMs);
        });
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, timeSpeed]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const addTime = useCallback((amount: number, unit: 'day' | 'month' | 'year') => {
    setSimDate((prev) => {
      const d = new Date(prev.getTime());
      if (unit === 'day') d.setUTCDate(d.getUTCDate() + amount);
      if (unit === 'month') d.setUTCMonth(d.getUTCMonth() + amount);
      if (unit === 'year') d.setUTCFullYear(d.getUTCFullYear() + amount);
      return d;
    });
  }, []);

  const jumpToEpoch = useCallback((year: number) => {
    setSimDate(new Date(Date.UTC(year, 5, 21, 12, 0, 0)));
  }, []);

  const setLiveNow = useCallback(() => {
    setSimDate(new Date());
  }, []);

  return {
    simDate,
    setSimDate,
    isPlaying,
    togglePlay,
    timeSpeed,
    setTimeSpeed,
    addTime,
    jumpToEpoch,
    setLiveNow,
  };
}
