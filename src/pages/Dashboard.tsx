import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, Brain, Server } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { CircularProgress } from '@/components/shared/CircularProgress';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonCard, SkeletonTableRow } from '@/components/shared/LoadingSkeleton';
import { CpuLineChart } from '@/components/charts/CpuLineChart';
import { MemoryBarChart } from '@/components/charts/MemoryBarChart';
import { useStore } from '@/store';
import { useCloudSimulation } from '@/hooks/useCloudSimulation';
import { getMetricColor, getStatusColor } from '@/lib/utils';
import type { CSSProperties } from 'react';

export function Dashboard() {
  const navigate = useNavigate();
  const { nodes, services, isLoading } = useCloudSimulation();
  const { alerts, predictions, systemHealthScore } = useStore();

  const stats = useMemo(() => {
    const healthy = nodes.filter((n) => n.status === 'healthy').length;
    const warning = nodes.filter((n) => n.status === 'warning').length;
    const critical = nodes.filter((n) => n.status === 'critical').length;
    const failed = nodes.filter((n) => n.status === 'failed').length;
    const activeAlerts = alerts.filter((a) => !a.acknowledged);
    const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical').length;
    const warningAlerts = activeAlerts.filter((a) => a.severity === 'high' || a.severity === 'medium').length;
    const activePredictions = predictions.filter((p) => p.status === 'active');
    const avgAccuracy = activePredictions.length > 0
      ? Math.round(activePredictions.reduce((s, p) => s + p.confidence, 0) / activePredictions.length)
      : 0;
    return { healthy, warning, critical, failed, totalAlerts: activeAlerts.length, criticalAlerts, warningAlerts, predCount: predictions.length, avgAccuracy, activeCount: activePredictions.length };
  }, [nodes, alerts, predictions]);

  const sortedNodes = useMemo(() =>
    [...nodes].sort((a, b) => {
      const order = { failed: 0, critical: 1, warning: 2, maintenance: 3, healthy: 4 };
      return (order[a.status] ?? 5) - (order[b.status] ?? 5);
    }),
    [nodes]
  );

  function getDepColor(status?: string) {
    if (status === 'healthy') return 'bg-emerald-50 border-emerald-200 text-emerald-600';
    if (status === 'warning') return 'bg-amber-50 border-amber-200 text-amber-600';
    return 'bg-red-50 border-red-200 text-red-500';
  }

  return (
    <PageWrapper title="Dashboard">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            {/* Node Health */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="h-1 bg-[#10b981]" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Node Health</span>
                  <Server size={16} className="text-slate-400" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">
                  <AnimatedNumber value={stats.healthy} /> / {nodes.length}
                </div>
                <p className="text-xs text-slate-400">
                  <span className="text-amber-500">{stats.warning} warning</span>
                  {' · '}
                  <span className="text-red-500">{stats.critical} critical</span>
                  {stats.failed > 0 && <span className="text-red-500"> · {stats.failed} failed</span>}
                </p>
              </div>
            </div>

            {/* Active Alerts */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="h-1 bg-[#ef4444]" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Alerts</span>
                  <AlertTriangle size={16} className="text-slate-400" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">
                  <AnimatedNumber value={stats.totalAlerts} />
                </div>
                <p className="text-xs text-slate-400">
                  <span className="text-red-500">{stats.criticalAlerts} critical</span>
                  {' · '}
                  <span className="text-amber-500">{stats.warningAlerts} warning</span>
                </p>
              </div>
            </div>

            {/* System Health */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="h-1 bg-[#6366f1]" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">System Health</span>
                  <Activity size={16} className="text-slate-400" />
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <CircularProgress value={systemHealthScore} size={72} strokeWidth={6} />
                  <div>
                    <p className="text-xs text-slate-400">{systemHealthScore}/100</p>
                    <p className="text-xs text-slate-400">system score</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Predictions */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="h-1 bg-[#8b5cf6]" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">AI Predictions</span>
                  <Brain size={16} className="text-slate-400" />
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">
                  <AnimatedNumber value={stats.predCount} />
                </div>
                <p className="text-xs text-slate-400">
                  <span className="text-[#8b5cf6]">{stats.avgAccuracy}% avg accuracy</span>
                  {' · '}
                  {stats.activeCount} active
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {isLoading ? (
          <>
            <div className="h-[280px] rounded-2xl border border-slate-200 bg-white animate-pulse" />
            <div className="h-[280px] rounded-2xl border border-slate-200 bg-white animate-pulse" />
          </>
        ) : (
          <>
            <CpuLineChart nodes={nodes} />
            <MemoryBarChart nodes={nodes} />
          </>
        )}
      </div>

      {/* Table + Service Panel */}
      <div className="grid grid-cols-5 gap-4 mt-4">
        {/* Node Table */}
        <div className="col-span-5 lg:col-span-3 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="section-header-accent text-sm font-semibold text-slate-800">Node Status</h3>
            <button onClick={() => navigate('/infrastructure')} className="text-xs text-[#6366f1] hover:text-[#4f46e5] transition-colors">
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Name', 'Region', 'CPU', 'Memory', 'Status', 'Action'].map((col) => (
                    <th key={col} className="text-left px-4 py-3 text-slate-400 text-xs uppercase tracking-wider font-medium whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }, (_, i) => <SkeletonTableRow key={i} />)
                  : sortedNodes.slice(0, 8).map((node) => (
                    <tr
                      key={node.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                      style={
                        node.status === 'critical' || node.status === 'failed'
                          ? { borderLeft: '2px solid #ef4444', background: '#fef2f2' }
                          : node.status === 'warning'
                          ? { borderLeft: '2px solid #f59e0b', background: '#fffbeb' }
                          : {}
                      }
                      onClick={() => navigate('/infrastructure')}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-700 text-xs">{node.displayName}</div>
                        <div className="text-[10px] text-slate-400">{node.type}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{node.region}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-between text-xs mb-0.5">
                          <span style={{ color: getMetricColor(node.metrics.cpu, 'cpu') }}>{node.metrics.cpu.toFixed(1)}%</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden bg-slate-200" style={{ width: 60 }}>
                          <div className="h-full rounded-full" style={{ width: `${node.metrics.cpu}%`, background: getMetricColor(node.metrics.cpu, 'cpu') }} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs mb-0.5" style={{ color: getMetricColor(node.metrics.memory, 'memory') }}>{node.metrics.memory.toFixed(1)}%</div>
                        <div className="h-1 rounded-full overflow-hidden bg-slate-200" style={{ width: 60 }}>
                          <div className="h-full rounded-full" style={{ width: `${node.metrics.memory}%`, background: getMetricColor(node.metrics.memory, 'memory') }} />
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={node.status} compact /></td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('/infrastructure'); }}
                          className="text-[#6366f1] hover:text-[#4f46e5] text-xs font-medium transition-colors"
                        >
                          Analyze →
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Service Panel */}
        <div className="col-span-5 lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h3 className="section-header-accent text-sm font-semibold text-slate-800">Service Health</h3>
          </div>
          <div className="p-4 space-y-0">
            {services.map((service) => {
              const depNodes = service.dependencies.map((depId) => nodes.find((n) => n.id === depId)).filter(Boolean);
              return (
                <div key={service.id} className="py-3 border-b border-slate-100 last:border-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={service.status} compact />
                        <span className="text-sm font-medium text-slate-700 truncate">{service.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">{service.version}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {service.dependencies.map((depId) => {
                          const depNode = depNodes.find((n) => n?.id === depId);
                          return (
                            <span
                              key={depId}
                              className={`text-[10px] px-1.5 py-0.5 rounded-md border ${getDepColor(depNode?.status)}`}
                            >
                              {depId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-slate-700">{service.uptime.toFixed(2)}%</div>
                      <div className="text-[10px] text-slate-400">uptime</div>
                    </div>
                  </div>
                  {/* Error budget bar */}
                  <div className="mt-2 h-1 rounded-full overflow-hidden bg-slate-200">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${service.errorBudgetRemaining}%`,
                        background: service.errorBudgetRemaining > 50 ? '#10b981' : service.errorBudgetRemaining > 20 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Error budget: {service.errorBudgetRemaining}% remaining</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default Dashboard;
