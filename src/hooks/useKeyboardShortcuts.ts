import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';

export function useKeyboardShortcuts() {
  const { setCommandOpen } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // "/" → focus AI chat
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        navigate('/ai-chat');
      }
      // Escape → close command palette
      if (e.key === 'Escape') {
        setCommandOpen(false);
      }
      // Cmd/Ctrl + K → open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, setCommandOpen]);
}
