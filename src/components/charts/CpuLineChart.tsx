import { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import type { CloudNode } from '@/types';

interface CpuLineChartProps {
  nodes: CloudNode[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#10b981'];

export function CpuLineChart({ nodes }: CpuLineChartProps) {
  const topNodes = useMemo(() => {
    return [...nodes].sort((a, b) => b.metrics.cpu - a.metrics.cpu).slice(0, 3);
  }, [nodes]);

  const data = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => {
      const point: Record<string, number | string> = { index: i };
      topNodes.forEach((node) => {
        const snap = node.history[i];
        point[node.id] = snap ? Math.round(snap.cpu) : 0;
      });
      return point;
    });
  }, [topNodes]);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
      <p className="section-header-accent text-sm font-semibold text-slate-800 mb-4">CPU Utilization Trend</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="index"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v * 8}s`}
            interval={4}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#334155', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            labelFormatter={(v) => `T-${(20 - Number(v)) * 8}s`}
            formatter={(value: unknown, name: unknown) => [`${value as number}%`, nodes.find((n) => n.id === (name as string))?.displayName ?? (name as string)]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(value) => <span style={{ color: '#64748b' }}>{nodes.find((n) => n.id === value)?.displayName ?? value}</span>}
          />
          {topNodes.map((node, i) => (
            <Line
              key={node.id}
              type="monotone"
              dataKey={node.id}
              stroke={COLORS[i]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: COLORS[i] }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
