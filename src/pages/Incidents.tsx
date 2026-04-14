import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronsUpDown, Download, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { IncidentsDailyChart } from '@/components/charts/IncidentsDailyChart';
import { IncidentTypesPieChart } from '@/components/charts/IncidentTypesPieChart';
import { MttrTrendChart } from '@/components/charts/MttrTrendChart';
import { useStore } from '@/store';
import { MOCK_INCIDENTS } from '@/data/mockIncidents';
import { exportIncidentsCSV } from '@/lib/csvExport';
import { getSeverityColor } from '@/lib/utils';
import type { Severity } from '@/types';

type SortKey = 'id' | 'startedAt' | 'nodeName' | 'severity' | 'duration' | 'status';

export function Incidents() {
  const { incidents, setIncidents } = useStore();
  const [sortCol, setSortCol] = useState<SortKey>('startedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (incidents.length === 0) {
      setIncidents(MOCK_INCIDENTS);
    }
  }, []);

  function handleSort(col: SortKey) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  }

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

  const sortedIncidents = useMemo(() => {
    return [...incidents].sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'id') cmp = a.id.localeCompare(b.id);
      else if (sortCol === 'startedAt') cmp = new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
      else if (sortCol === 'nodeName') cmp = a.nodeName.localeCompare(b.nodeName);
      else if (sortCol === 'severity') cmp = (severityOrder[a.severity as Severity] ?? 5) - (severityOrder[b.severity as Severity] ?? 5);
      else if (sortCol === 'duration') cmp = a.duration - b.duration;
      else if (sortCol === 'status') cmp = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [incidents, sortCol, sortDir]);

  const COLUMNS: { key: SortKey; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'startedAt', label: 'Date' },
    { key: 'nodeName', label: 'Node' },
    { key: 'severity', label: 'Severity' },
    { key: 'duration', label: 'Duration' },
    { key: 'status', label: 'Status' },
  ];

  const totalCost = incidents.reduce((s, i) => s + i.cost, 0);
  const aiPredicted = incidents.filter((i) => i.aiPredicted).length;
  const avgMttr = incidents.length > 0 ? Math.round(incidents.reduce((s, i) => s + i.duration, 0) / incidents.length) : 0;

  return (
    <PageWrapper title="Incident History">
      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Incidents', value: incidents.length, color: '#6366f1' },
          { label: 'AI Predicted', value: aiPredicted, color: '#8b5cf6', suffix: ` (${incidents.length > 0 ? Math.round(aiPredicted / incidents.length * 100) : 0}%)` },
          { label: 'Avg MTTR', value: avgMttr, color: '#f59e0b', suffix: 'm' },
          { label: 'Total Cost Impact', value: `$${totalCost.toLocaleString()}`, color: '#ef4444', isString: true },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold mb-0.5" style={{ color: stat.color }}>
              {stat.isString ? stat.value : `${stat.value}${stat.suffix ?? ''}`}
            </div>
            <div className="text-xs text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden mb-6 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="section-header-accent text-sm font-semibold text-slate-800">Incident Log</h3>
          <button
            onClick={() => exportIncidentsCSV(incidents)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium cursor-pointer hover:text-slate-700 select-none whitespace-nowrap"
                    style={{ color: sortCol === col.key ? '#6366f1' : '#94a3b8' }}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <ChevronsUpDown size={12} style={{ color: sortCol === col.key ? '#6366f1' : '#cbd5e1' }} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-xs text-slate-400 uppercase tracking-wider">AI</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {sortedIncidents.map((incident) => (
                <>
                  <tr
                    key={incident.id}
                    onClick={() => setExpanded(expanded === incident.id ? null : incident.id)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#6366f1]">{incident.id}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDistanceToNow(new Date(incident.startedAt))} ago</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-700 text-xs">{incident.nodeName}</div>
                      <div className="text-[10px] text-slate-400">{incident.region}</div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge severity={incident.severity as Severity} compact /></td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-700 text-sm">{incident.duration}m</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={incident.status} compact /></td>
                    <td className="px-4 py-3">
                      {incident.aiPredicted && (
                        <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                          AI: {incident.predictionAccuracy}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronDown
                        size={14}
                        className="text-slate-400 transition-transform"
                        style={{ transform: expanded === incident.id ? 'rotate(180deg)' : 'rotate(0)' }}
                      />
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expanded === incident.id && (
                      <motion.tr
                        key={`${incident.id}-expanded`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={8} className="bg-slate-50 border-b border-slate-200">
                          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-slate-400 uppercase mb-1 tracking-wider">Trigger</p>
                              <p className="text-sm text-slate-600 leading-relaxed">{incident.trigger}</p>
                              <p className="text-xs text-slate-400 mt-2">Type: <span className="text-slate-600">{incident.type}</span></p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 uppercase mb-1 tracking-wider">Resolution Steps</p>
                              <ol className="list-decimal list-inside space-y-1">
                                {incident.resolutionSteps.map((step, i) => (
                                  <li key={i} className="text-xs text-slate-600">{step}</li>
                                ))}
                              </ol>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 uppercase mb-1 tracking-wider">Impact</p>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {incident.impactedServices.map((s) => (
                                  <span key={s} className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-500 border border-red-200">{s}</span>
                                ))}
                                {incident.impactedServices.length === 0 && <span className="text-xs text-slate-400">None</span>}
                              </div>
                              <p className="text-xs text-slate-400">Est. Cost: <span className="font-medium text-amber-500">${incident.cost.toLocaleString()}</span></p>
                              {incident.resolvedBy && <p className="text-xs text-slate-400 mt-1">Resolved by: <span className="text-slate-600">{incident.resolvedBy}</span></p>}
                              {incident.postmortemUrl && (
                                <a href={incident.postmortemUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6366f1] hover:text-[#4f46e5] mt-1 block">
                                  View Postmortem →
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <IncidentsDailyChart incidents={incidents} />
        <IncidentTypesPieChart incidents={incidents} />
        <MttrTrendChart incidents={incidents} />
      </div>
    </PageWrapper>
  );
}

export default Incidents;
