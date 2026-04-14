import { useEffect, useRef, useState } from 'react';

export function useAnimatedNumber(value: number, duration = 600): number {
  const [displayValue, setDisplayValue] = useState(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = displayValue;
    const diff = value - startValue;
    if (diff === 0) return;

    let startTime: number | null = null;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + diff * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return displayValue;
}
