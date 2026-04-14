import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { Incident } from '@/types';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

export function IncidentTypesPieChart({ incidents }: { incidents: Incident[] }) {
  const data = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    incidents.forEach((inc) => { typeCounts[inc.type] = (typeCounts[inc.type] || 0) + 1; });
    return Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([type, count]) => ({ type, count, pct: Math.round((count / incidents.length) * 100) }));
  }, [incidents]);

  const total = incidents.length;

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
      <p className="section-header-accent text-sm font-semibold text-slate-800 mb-4">Incidents by Type</p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="count" paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#334155', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              formatter={(value: unknown, _: unknown, props: { payload?: { pct: number } }) => [`${value as number} (${props.payload?.pct ?? 0}%)`, 'Incidents']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5">
          {data.map((entry, i) => (
            <div key={entry.type} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-slate-600 truncate max-w-[120px]">{entry.type}</span>
              </div>
              <span className="text-slate-400 ml-2">{entry.count} ({Math.round(entry.count / total * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
