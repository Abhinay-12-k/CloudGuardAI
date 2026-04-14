import type React from 'react';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Network, Zap, Bell, FileWarning, MessageSquare, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';

type NavItem = {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/infrastructure', label: 'Infrastructure', icon: Network },
  { path: '/predictions', label: 'Predictions', icon: Zap },
  { path: '/alerts', label: 'Alerts', icon: Bell, badge: true },
  { path: '/incidents', label: 'Incidents', icon: FileWarning },
  { path: '/ai-chat', label: 'AI Chat', icon: MessageSquare },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const alerts = useStore((s) => s.alerts);
  const criticalAlertCount = alerts.filter((a) => !a.acknowledged && a.severity === 'critical').length;

  return (
    <aside
      className="fixed left-0 top-0 h-full z-40 flex flex-col"
      style={{
        width: isExpanded ? 224 : 64,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-[11px] py-4 flex-shrink-0" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div className="w-[40px] h-[40px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 15c0-3.31 2.69-6 6-6 .34 0 .68.03 1 .08C10.56 7.3 12.6 6 15 6c3.31 0 6 2.69 6 6 0 .34-.03.68-.08 1H21a3 3 0 010 6H6a3 3 0 01-3-3v-1z" fill="white" fillOpacity="0.95" />
            <path d="M10 13l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="whitespace-nowrap"
            >
              <span className="font-bold text-sm" style={{ color: '#0f172a' }}>CloudGuard</span>
              <span className="font-bold text-sm ml-1" style={{ color: '#6366f1' }}>AI</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          const alertBadge = item.badge && criticalAlertCount > 0;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-[11px] py-2.5 mx-2 rounded-xl cursor-pointer transition-all duration-150 relative',
              )}
              style={{
                color: isActive ? '#6366f1' : '#64748b',
                background: isActive ? '#6366f110' : 'transparent',
                fontWeight: isActive ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full bg-[#6366f1]" />
              )}
              <item.icon size={18} className="flex-shrink-0" />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {alertBadge && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[18px] h-[18px] rounded-full bg-[#ef4444] text-white text-[10px] font-semibold flex items-center justify-center">
                  {criticalAlertCount > 9 ? '9+' : criticalAlertCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="py-3 px-[11px] flex-shrink-0" style={{ borderTop: '1px solid #e2e8f0' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 status-pulse"
            style={{ background: '#10b981', color: '#10b981' }}
          />
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-xs font-medium whitespace-nowrap" style={{ color: '#334155' }}>System Live</p>
                <p className="text-[10px]" style={{ color: '#94a3b8' }}>v2.4.1</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
