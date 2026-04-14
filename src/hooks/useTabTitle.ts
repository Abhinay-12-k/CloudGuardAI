import { useEffect } from 'react';

export function useTabTitle() {
  useEffect(() => {
    let state = 0;
    const interval = setInterval(() => {
      document.title = state % 2 === 0 ? '● CloudGuard AI' : '○ CloudGuard AI';
      state++;
    }, 2000);
    return () => clearInterval(interval);
  }, []);
}
