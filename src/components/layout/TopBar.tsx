import { useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useStore } from '@/store';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/infrastructure': 'Infrastructure Map',
  '/predictions': 'Fault Predictions',
  '/alerts': 'Alerts Center',
  '/incidents': 'Incident History',
  '/ai-chat': 'AI Chat',
  '/settings': 'Settings',
};

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { alerts, predictions, systemHealthScore, setCommandOpen } = useStore();

  const title = PAGE_TITLES[location.pathname] ?? 'CloudGuard AI';
  const activeCount = predictions.filter((p) => p.status === 'active').length;
  const criticalAlertCount = alerts.filter((a) => !a.acknowledged && a.severity === 'critical').length;

  const healthColor =
    systemHealthScore >= 80
      ? { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0', label: 'Healthy' }
      : systemHealthScore >= 60
      ? { bg: '#fef9c3', text: '#ca8a04', border: '#fde68a', label: 'Degraded' }
      : { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5', label: 'Critical' };

  return (
    <header
      className="fixed top-0 right-0 h-[52px] z-30 flex items-center px-5 gap-4"
      style={{
        left: 64,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Title */}
      <span className="font-semibold text-base flex-shrink-0" style={{ color: '#0f172a' }}>{title}</span>

      {/* AI status badge */}
      <div className="flex-1 flex justify-center">
        <div
          className="flex items-center gap-2 px-4 py-1 rounded-full text-xs font-medium"
          style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] status-pulse" style={{ color: '#8b5cf6' }} />
          AI Active · {activeCount} prediction{activeCount !== 1 ? 's' : ''} running
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {/* Search */}
        <button
          onClick={() => setCommandOpen(true)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100"
          title="Search (Ctrl+K)"
          style={{ color: '#64748b' }}
        >
          <Search size={16} />
        </button>

        {/* System health pill */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: healthColor.bg, border: `1px solid ${healthColor.border}`, color: healthColor.text }}
        >
          <span className="status-pulse" style={{ color: healthColor.text }}>●</span>
          <span>{systemHealthScore} {healthColor.label}</span>
        </div>

        {/* Critical alert count */}
        {criticalAlertCount > 0 && (
          <button
            onClick={() => navigate('/alerts')}
            className="w-7 h-7 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-xs font-bold hover:bg-[#dc2626] transition-colors shadow-sm"
          >
            {criticalAlertCount > 9 ? '9+' : criticalAlertCount}
          </button>
        )}

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-xs font-semibold cursor-pointer shadow-sm">
          JD
        </div>
      </div>
    </header>
  );
}
