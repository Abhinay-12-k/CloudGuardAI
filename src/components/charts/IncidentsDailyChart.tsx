import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import type { Incident } from '@/types';

interface IncidentsDailyChartProps {
  incidents: Incident[];
}

export function IncidentsDailyChart({ incidents }: IncidentsDailyChartProps) {
  const data = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const day = subDays(new Date(), 13 - i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayIncidents = incidents.filter((inc) => format(new Date(inc.startedAt), 'yyyy-MM-dd') === dayStr);
      const hasCritical = dayIncidents.some((inc) => inc.severity === 'critical');
      const hasHigh = dayIncidents.some((inc) => inc.severity === 'high');
      const color = hasCritical ? '#ef4444' : hasHigh ? '#f59e0b' : '#6366f1';
      return { label: format(day, 'MMM d'), count: dayIncidents.length, color };
    });
  }, [incidents]);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
      <p className="section-header-accent text-sm font-semibold text-slate-800 mb-4">Incidents per Day</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={14}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#334155', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            formatter={(value: unknown) => [value as number, 'Incidents']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.8} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
