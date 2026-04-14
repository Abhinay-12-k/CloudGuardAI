import { useEffect, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
}

export function PageWrapper({ children, title }: PageWrapperProps) {
  useEffect(() => {
    if (title) {
      document.title = `● ${title} — CloudGuard AI`;
    }
  }, [title]);

  return (
    <main className="ml-[64px] pt-[52px] min-h-screen bg-dot-grid" style={{ background: '#f1f5f9' }}>
      <motion.div
        className="p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </main>
  );
}
