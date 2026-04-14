import { format } from 'date-fns';
import type { Incident } from '@/types';

export function exportIncidentsCSV(incidents: Incident[]) {
  const headers = ['ID', 'Date', 'Node', 'Region', 'Fault Type', 'Severity', 'Duration (min)', 'Status', 'AI Predicted', 'Prediction Accuracy (%)', 'Cost ($)', 'Resolved By'];
  const rows = incidents.map((inc) => [
    inc.id,
    format(new Date(inc.startedAt), 'yyyy-MM-dd HH:mm:ss'),
    inc.nodeName,
    inc.region,
    inc.type,
    inc.severity,
    inc.duration.toString(),
    inc.status,
    inc.aiPredicted ? 'Yes' : 'No',
    inc.predictionAccuracy?.toString() ?? 'N/A',
    inc.cost.toString(),
    inc.resolvedBy ?? 'N/A',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cloudguard-incidents-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
