import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import type { Alert } from '@/types';

interface AlertsHourlyChartProps {
  alerts: Alert[];
}

export function AlertsHourlyChart({ alerts }: AlertsHourlyChartProps) {
  const data = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const hoursAgo = 11 - i;
      const hourStart = Date.now() - (hoursAgo + 1) * 3600000;
      const hourEnd = Date.now() - hoursAgo * 3600000;
      const hourAlerts = alerts.filter((a) => {
        const t = new Date(a.timestamp).getTime();
        return t >= hourStart && t < hourEnd;
      });
      const hasCritical = hourAlerts.some((a) => a.severity === 'critical');
      const hasHigh = hourAlerts.some((a) => a.severity === 'high');
      const color = hasCritical ? '#ef4444' : hasHigh ? '#f59e0b' : '#6366f1';
      return { label: hoursAgo === 0 ? 'Now' : `${hoursAgo}h`, count: hourAlerts.length, color };
    });
  }, [alerts]);

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barSize={18}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#334155', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          formatter={(value: unknown) => [value as number, 'Alerts']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
