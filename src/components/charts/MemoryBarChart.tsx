import { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
} from 'recharts';
import type { CloudNode } from '@/types';
import { useStore } from '@/store';

interface MemoryBarChartProps {
  nodes: CloudNode[];
}

function getBarColor(memory: number): string {
  if (memory >= 80) return '#ef4444';
  if (memory >= 65) return '#f59e0b';
  return '#10b981';
}

export function MemoryBarChart({ nodes }: MemoryBarChartProps) {
  const settings = useStore((s) => s.settings);
  const data = useMemo(() =>
    nodes.map((n) => ({
      name: n.displayName.slice(0, 8),
      memory: Math.round(n.metrics.memory),
      id: n.id,
    })),
    [nodes]
  );

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
      <p className="section-header-accent text-sm font-semibold text-slate-800 mb-4">Memory Distribution</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={16}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#334155', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            formatter={(value: unknown) => [`${value as number}%`, 'Memory']}
          />
          <ReferenceLine
            y={settings.memoryWarningThreshold}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            label={{ value: 'Warning', fill: '#ca8a04', fontSize: 10, position: 'right' }}
          />
          <Bar dataKey="memory" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.id} fill={getBarColor(entry.memory)} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
