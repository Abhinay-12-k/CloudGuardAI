import { cn } from '@/lib/utils';
import type { NodeStatus, Severity, ServiceStatus } from '@/types';

type Status = NodeStatus | Severity | ServiceStatus | string;

interface StatusBadgeProps {
  status?: Status;
  severity?: Severity;
  compact?: boolean;
  pulse?: boolean;
}

function getBadgeStyle(status: Status): { bg: string; text: string; border: string; dot: string } {
  switch (status) {
    case 'healthy':
    case 'operational':
    case 'resolved':
    case 'verified':
      return { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0', dot: '#16a34a' };
    case 'warning':
    case 'degraded':
    case 'high':
    case 'monitoring':
      return { bg: '#fef9c3', text: '#ca8a04', border: '#fde68a', dot: '#ca8a04' };
    case 'critical':
    case 'failed':
    case 'down':
    case 'missed':
      return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5', dot: '#dc2626' };
    case 'maintenance':
    case 'pending':
    case 'false_positive':
      return { bg: '#ede9fe', text: '#7c3aed', border: '#ddd6fe', dot: '#7c3aed' };
    case 'medium':
      return { bg: '#e0e7ff', text: '#4f46e5', border: '#c7d2fe', dot: '#4f46e5' };
    case 'low':
    case 'info':
      return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', dot: '#94a3b8' };
    case 'active':
      return { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe', dot: '#7c3aed' };
    case 'ongoing':
      return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5', dot: '#dc2626' };
    default:
      return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', dot: '#94a3b8' };
  }
}

export function StatusBadge({ status, severity, compact = false, pulse = true }: StatusBadgeProps) {
  const s = status ?? severity ?? 'info';
  const style = getBadgeStyle(s);
  const label = s.replace(/_/g, ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        compact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'
      )}
      style={{ backgroundColor: style.bg, color: style.text, border: `1px solid ${style.border}` }}
    >
      <span
        className={cn('rounded-full flex-shrink-0', compact ? 'w-1.5 h-1.5' : 'w-2 h-2', pulse && 'status-pulse')}
        style={{ backgroundColor: style.dot, color: style.dot }}
      />
      {label}
    </span>
  );
}
