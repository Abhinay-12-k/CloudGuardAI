import { useNavigate } from 'react-router-dom';
import { X, Shield, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useStore } from '@/store';
import { getMetricColor } from '@/lib/utils';
import type { CSSProperties } from 'react';

interface NodeDetailSheetProps {
  nodeId: string | null;
  onClose: () => void;
}

export function NodeDetailSheet({ nodeId, onClose }: NodeDetailSheetProps) {
  const navigate = useNavigate();
  const { nodes, incidents } = useStore();
  const node = nodes.find((n) => n.id === nodeId);

  if (!node) return null;

  const nodeIncidents = incidents.filter((inc) => inc.nodeId === node.id).slice(0, 3);
  const metrics = [
    { label: 'CPU', value: node.metrics.cpu, unit: '%', type: 'cpu' as const },
    { label: 'Memory', value: node.metrics.memory, unit: '%', type: 'memory' as const },
    { label: 'Disk', value: node.metrics.disk, unit: '%', type: 'disk' as const },
    { label: 'Latency', value: node.metrics.networkLatency, unit: 'ms', type: 'cpu' as const, noBar: true },
    { label: 'Error Rate', value: node.metrics.errorRate, unit: '%', type: 'error' as const },
    { label: 'Req/sec', value: node.metrics.requestsPerSec, unit: '', type: 'cpu' as const, noBar: true },
  ];

  return (
    <Dialog.Root open={!!nodeId} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 z-50" />
        <Dialog.Content
          className="fixed right-0 top-0 h-full z-50 overflow-y-auto flex flex-col"
          style={{ width: 480, background: '#ffffff', borderLeft: '1px solid #e2e8f0', boxShadow: '-8px 0 32px rgba(0,0,0,0.08)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-slate-800 font-semibold">{node.displayName}</h2>
                <p className="text-xs text-slate-400">{node.id}</p>
              </div>
              <StatusBadge status={node.status} />
            </div>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 p-5 space-y-5 overflow-y-auto">
            {/* Identity */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Identity</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 rounded-lg" style={{ background: '#f1f5f9', color: '#475569' }}>{node.provider}</span>
                <span className="text-xs px-2 py-1 rounded-lg" style={{ background: '#f1f5f9', color: '#475569' }}>{node.region}</span>
                <span className="text-xs px-2 py-1 rounded-lg" style={{ background: '#f1f5f9', color: '#475569' }}>{node.az}</span>
                <span className="text-xs px-2 py-1 rounded-lg" style={{ background: '#f1f5f9', color: '#475569' }}>{node.type}</span>
                {node.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-lg" style={{ background: '#ede9fe', color: '#6366f1', border: '1px solid #ddd6fe' }}>{tag}</span>
                ))}
              </div>
              <div className="mt-2 flex gap-4 text-xs text-slate-400">
                <span>Uptime: <span className="text-[#10b981] font-medium">{node.uptime.toFixed(3)}%</span></span>
                {node.lastIncident && (
                  <span>Last incident: {formatDistanceToNow(new Date(node.lastIncident))} ago</span>
                )}
              </div>
            </div>

            {/* Live Metrics */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Live Metrics</p>
              <div className="grid grid-cols-2 gap-3">
                {metrics.map((m) => {
                  const color = getMetricColor(m.value, m.type === 'error' ? 'error' : m.type as 'cpu' | 'memory' | 'disk');
                  return (
                    <div key={m.label} className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-slate-400">{m.label}</span>
                        <span className="text-sm font-bold" style={{ color }}>{m.value.toFixed(m.unit === 'ms' ? 0 : 1)}{m.unit}</span>
                      </div>
                      {!m.noBar && (
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
                          <div
                            className="h-full rounded-full bar-animated"
                            style={{ '--target-width': `${Math.min(m.value, 100)}%`, width: `${Math.min(m.value, 100)}%`, backgroundColor: color } as CSSProperties}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Uptime visualization */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">7-Day Uptime</p>
              <div className="space-y-1">
                {Array.from({ length: 7 }, (_, dayIdx) => {
                  const dayLabel = dayIdx === 6 ? 'Today' : `${6 - dayIdx}d ago`;
                  return (
                    <div key={dayIdx} className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 w-12 text-right">{dayLabel}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 24 }, (_, h) => {
                          const hasIssue = dayIdx < 6 && Math.random() < (node.status === 'healthy' ? 0.02 : 0.1);
                          const isCrit = hasIssue && Math.random() < 0.3;
                          return (
                            <div
                              key={h}
                              className="w-1 h-4 rounded-sm"
                              style={{ background: isCrit ? '#ef4444' : hasIssue ? '#f59e0b' : '#10b981', opacity: hasIssue ? 0.8 : 0.5 }}
                              title={`${dayLabel} ${h}:00`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Incident log */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Recent Incidents</p>
              {nodeIncidents.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <Shield size={24} className="text-[#10b981] mb-2" />
                  <p className="text-xs text-slate-400">No incidents recorded</p>
                </div>
              ) : (
                <div className="relative pl-5">
                  <div className="absolute left-2 top-0 bottom-0 w-px" style={{ background: '#e2e8f0' }} />
                  {nodeIncidents.map((inc) => (
                    <div key={inc.id} className="relative mb-4">
                      <div
                        className="absolute -left-3 w-2 h-2 rounded-full"
                        style={{ background: inc.severity === 'critical' ? '#ef4444' : inc.severity === 'high' ? '#f59e0b' : '#6366f1' }}
                      />
                      <p className="text-sm font-medium text-slate-700">{inc.type}</p>
                      <p className="text-xs text-slate-400">{formatDistanceToNow(new Date(inc.startedAt))} ago · {inc.duration}m</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-5 border-t border-slate-200 flex-shrink-0 space-y-2">
            <button
              className="w-full btn-gradient text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
              onClick={() => { onClose(); navigate('/predictions'); }}
            >
              <Zap size={14} /> Run AI Analysis
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
