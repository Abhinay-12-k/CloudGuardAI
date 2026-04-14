import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Sparkline } from '@/components/shared/Sparkline';
import { SkeletonNodeCard } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { NodeDetailSheet } from '@/components/modals/NodeDetailSheet';
import { useStore } from '@/store';
import { useCloudSimulation } from '@/hooks/useCloudSimulation';
import { cn, getMetricColor, getStatusColor } from '@/lib/utils';
import type { CSSProperties } from 'react';
import type { NodeType, Region, NodeStatus } from '@/types';

const NODE_TYPE_ICONS: Record<string, string> = {
  'web-server': '🌐',
  'database': '🗄️',
  'load-balancer': '⚖️',
  'cache': '⚡',
  'queue': '📨',
  'api-gateway': '🔌',
};

export function Infrastructure() {
  const { nodes, isLoading } = useCloudSimulation();
  const { setSelectedNodeId, ui } = useStore();
  const [filters, setFilters] = useState({
    region: 'all',
    status: 'all',
    type: 'all',
    provider: 'all',
  });

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (filters.region !== 'all' && n.region !== filters.region) return false;
      if (filters.status !== 'all' && n.status !== filters.status) return false;
      if (filters.type !== 'all' && n.type !== filters.type) return false;
      if (filters.provider !== 'all' && n.provider !== filters.provider) return false;
      return true;
    });
  }, [nodes, filters]);

  const hasFilters = Object.values(filters).some((v) => v !== 'all');

  const selectStyle = "input-base rounded-lg px-3 py-1.5 text-sm cursor-pointer";

  return (
    <PageWrapper title="Infrastructure Map">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-slate-200">
        <select value={filters.region} onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))} className={selectStyle}>
          <option value="all">All Regions</option>
          <option value="us-east-1">US East</option>
          <option value="eu-west-2">EU West</option>
          <option value="ap-south-1">AP South</option>
        </select>
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className={selectStyle}>
          <option value="all">All Status</option>
          <option value="healthy">Healthy</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
          <option value="failed">Failed</option>
        </select>
        <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))} className={selectStyle}>
          <option value="all">All Types</option>
          <option value="web-server">Web Server</option>
          <option value="database">Database</option>
          <option value="load-balancer">Load Balancer</option>
          <option value="cache">Cache</option>
          <option value="queue">Queue</option>
          <option value="api-gateway">API Gateway</option>
        </select>
        <select value={filters.provider} onChange={(e) => setFilters((f) => ({ ...f, provider: e.target.value }))} className={selectStyle}>
          <option value="all">All Providers</option>
          <option value="AWS">AWS</option>
          <option value="GCP">GCP</option>
          <option value="Azure">Azure</option>
        </select>
        <span className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-500">
          {filteredNodes.length} nodes
        </span>
        {hasFilters && (
          <button onClick={() => setFilters({ region: 'all', status: 'all', type: 'all', provider: 'all' })} className="text-xs text-[#6366f1] hover:text-[#4f46e5] transition-colors">
            Reset filters ×
          </button>
        )}
      </div>

      {/* Node Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => <SkeletonNodeCard key={i} />)}
        </div>
      ) : filteredNodes.length === 0 ? (
        <EmptyState icon={Network} title="No nodes match your filters" action={{ label: 'Clear filters', onClick: () => setFilters({ region: 'all', status: 'all', type: 'all', provider: 'all' }) }} />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNodes.map((node) => {
              const statusColor = getStatusColor(node.status);
              return (
                <motion.div
                  key={node.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'rounded-2xl border bg-white p-4 cursor-pointer transition-all duration-200 hover:shadow-md',
                    node.status === 'critical' ? 'border-red-200 critical-card-glow' :
                    node.status === 'failed' ? 'border-red-400' :
                    node.status === 'warning' ? 'border-amber-200' :
                    'border-slate-200'
                  )}
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-slate-100">
                        {NODE_TYPE_ICONS[node.type]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{node.displayName}</p>
                        <p className="text-[10px] text-slate-400">{node.az}</p>
                      </div>
                    </div>
                    <StatusBadge status={node.status} compact />
                  </div>

                  {/* Provider */}
                  <div className="flex gap-1 mb-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">{node.provider}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">{node.region}</span>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-2">
                    {[
                      { label: 'CPU', value: node.metrics.cpu, type: 'cpu' as const },
                      { label: 'Memory', value: node.metrics.memory, type: 'memory' as const },
                      { label: 'Disk', value: node.metrics.disk, type: 'disk' as const },
                      { label: 'Error Rate', value: node.metrics.errorRate, type: 'error' as const },
                    ].map((m) => {
                      const color = getMetricColor(m.value, m.type);
                      return (
                        <div key={m.label}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-slate-400">{m.label}</span>
                            <span style={{ color }}>{m.value.toFixed(1)}%</span>
                          </div>
                          <div className="h-1 rounded-full overflow-hidden bg-slate-200">
                            <div
                              className="h-full rounded-full bar-animated"
                              style={{ '--target-width': `${Math.min(m.value, 100)}%`, width: `${Math.min(m.value, 100)}%`, backgroundColor: color } as CSSProperties}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom */}
                  <div className="flex items-end justify-between mt-3">
                    <Sparkline data={node.history.map((h) => h.cpu)} color={statusColor} height={28} width={80} />
                    <span className="text-[10px] text-slate-400">↑ {Math.round(node.metrics.requestsPerSec)} RPS</span>
                  </div>

                  {/* Fault imminent banner */}
                  {node.faultImminent && (
                    <div className="mx-[-16px] mb-[-16px] mt-3 px-4 py-1.5 rounded-b-2xl" style={{ background: '#fef2f2', borderTop: '1px solid #fecaca' }}>
                      <p className="text-xs font-semibold text-red-500">⚠ Fault Imminent</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Node Detail Sheet */}
      <NodeDetailSheet nodeId={ui.selectedNodeId} onClose={() => setSelectedNodeId(null)} />
    </PageWrapper>
  );
}

export default Infrastructure;
