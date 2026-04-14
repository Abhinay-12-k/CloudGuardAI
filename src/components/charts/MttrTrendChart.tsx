import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import type { Incident } from '@/types';

interface MttrTrendChartProps {
  incidents: Incident[];
}

export function MttrTrendChart({ incidents }: MttrTrendChartProps) {
  const { data, avgMttr } = useMemo(() => {
    const resolved = incidents.filter((inc) => inc.duration > 0);
    const overall = resolved.length > 0 ? Math.round(resolved.reduce((s, i) => s + i.duration, 0) / resolved.length) : 0;

    const chartData = Array.from({ length: 14 }, (_, i) => {
      const day = subDays(new Date(), 13 - i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayResolved = resolved.filter((inc) =>
        format(new Date(inc.startedAt), 'yyyy-MM-dd') === dayStr
      );
      const mttr = dayResolved.length > 0
        ? Math.round(dayResolved.reduce((s, inc) => s + inc.duration, 0) / dayResolved.length)
        : null;
      return { label: format(day, 'MMM d'), mttr };
    });

    return { data: chartData, avgMttr: overall };
  }, [incidents]);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
      <p className="section-header-accent text-sm font-semibold text-slate-800 mb-4">MTTR Trend (minutes)</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} unit="m" />
          <Tooltip
            contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#334155', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            formatter={(value: unknown) => [`${value as number}m`, 'MTTR']}
          />
          {avgMttr > 0 && (
            <ReferenceLine
              y={avgMttr}
              stroke="#6366f1"
              strokeDasharray="4 4"
              label={{ value: `Avg ${avgMttr}m`, fill: '#6366f1', fontSize: 10, position: 'right' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="mttr"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
