import type { Alert, CloudNode, NodeStatus, Severity } from '@/types';
import { generateId } from './utils';

const lastAlertTimes: Record<string, Record<string, number>> = {};

function canAlert(nodeId: string, type: string): boolean {
  if (!lastAlertTimes[nodeId]) lastAlertTimes[nodeId] = {};
  const last = lastAlertTimes[nodeId][type] || 0;
  return Date.now() - last > 60000;
}

function markAlerted(nodeId: string, type: string) {
  if (!lastAlertTimes[nodeId]) lastAlertTimes[nodeId] = {};
  lastAlertTimes[nodeId][type] = Date.now();
}

export function generateAlerts(
  currentNodes: CloudNode[],
  previousNodes: CloudNode[],
  settings: { cpuWarningThreshold: number; memoryWarningThreshold: number; errorRateThreshold: number; diskWarningThreshold: number }
): Alert[] {
  const newAlerts: Alert[] = [];

  for (const node of currentNodes) {
    const prev = previousNodes.find((n) => n.id === node.id);
    const prevStatus: NodeStatus = prev?.status ?? 'healthy';

    // Status transition alerts
    if (prevStatus !== node.status) {
      let severity: Severity = 'info';
      let message = '';
      let detail = '';

      if (node.status === 'critical' && prevStatus !== 'critical') {
        severity = 'critical';
        message = `Node entered critical state`;
        detail = `CPU: ${node.metrics.cpu.toFixed(1)}%, Memory: ${node.metrics.memory.toFixed(1)}%, Error Rate: ${node.metrics.errorRate.toFixed(2)}%`;
      } else if (node.status === 'failed') {
        severity = 'critical';
        message = `Node is DOWN`;
        detail = `Node has failed and is not responding. Immediate action required.`;
      } else if (node.status === 'warning' && prevStatus === 'healthy') {
        severity = 'medium';
        message = `Node degraded to warning state`;
        detail = `Performance degrading — monitor closely`;
      } else if (node.status === 'healthy' && (prevStatus === 'critical' || prevStatus === 'warning')) {
        severity = 'info';
        message = `Node recovered to healthy state`;
        detail = `Node has returned to normal operation`;
      }

      if (message && canAlert(node.id, `status-${node.status}`)) {
        newAlerts.push({
          id: `alert-${generateId()}`,
          nodeId: node.id,
          nodeName: node.displayName,
          region: node.region,
          severity,
          type: node.status === 'failed' ? 'node_down' : 'error_rate',
          message,
          detail,
          timestamp: new Date(),
          acknowledged: false,
          acknowledgedBy: null,
          acknowledgedAt: null,
          assignedTo: null,
          notes: [],
          relatedAlertIds: [],
          resolvedAt: null,
          tags: node.tags,
        });
        markAlerted(node.id, `status-${node.status}`);
      }
    }

    // Threshold-based alerts
    if (node.metrics.cpu > settings.cpuWarningThreshold && canAlert(node.id, 'cpu_spike')) {
      const severity: Severity = node.metrics.cpu > 90 ? 'critical' : 'high';
      newAlerts.push({
        id: `alert-${generateId()}`,
        nodeId: node.id,
        nodeName: node.displayName,
        region: node.region,
        severity,
        type: 'cpu_spike',
        message: `CPU utilization at ${node.metrics.cpu.toFixed(1)}%`,
        detail: `CPU has exceeded the ${settings.cpuWarningThreshold}% warning threshold. Consider scaling or investigating runaway processes.`,
        timestamp: new Date(),
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
        assignedTo: null,
        notes: [],
        relatedAlertIds: [],
        resolvedAt: null,
        tags: node.tags,
      });
      markAlerted(node.id, 'cpu_spike');
    }

    if (node.metrics.memory > settings.memoryWarningThreshold && canAlert(node.id, 'memory_pressure')) {
      const severity: Severity = node.metrics.memory > 90 ? 'critical' : 'high';
      newAlerts.push({
        id: `alert-${generateId()}`,
        nodeId: node.id,
        nodeName: node.displayName,
        region: node.region,
        severity,
        type: 'memory_pressure',
        message: `Memory pressure at ${node.metrics.memory.toFixed(1)}%`,
        detail: `Memory usage has exceeded the ${settings.memoryWarningThreshold}% threshold. Risk of OOM kill.`,
        timestamp: new Date(),
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
        assignedTo: null,
        notes: [],
        relatedAlertIds: [],
        resolvedAt: null,
        tags: node.tags,
      });
      markAlerted(node.id, 'memory_pressure');
    }

    if (node.metrics.errorRate > settings.errorRateThreshold && canAlert(node.id, 'error_rate')) {
      const severity: Severity = node.metrics.errorRate > 5 ? 'critical' : 'high';
      newAlerts.push({
        id: `alert-${generateId()}`,
        nodeId: node.id,
        nodeName: node.displayName,
        region: node.region,
        severity,
        type: 'error_rate',
        message: `Error rate spike: ${node.metrics.errorRate.toFixed(2)}%`,
        detail: `Error rate has exceeded ${settings.errorRateThreshold}% threshold. Investigate application logs.`,
        timestamp: new Date(),
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
        assignedTo: null,
        notes: [],
        relatedAlertIds: [],
        resolvedAt: null,
        tags: node.tags,
      });
      markAlerted(node.id, 'error_rate');
    }

    if (node.metrics.disk > settings.diskWarningThreshold && canAlert(node.id, 'disk_full')) {
      const severity: Severity = node.metrics.disk > 95 ? 'critical' : 'high';
      newAlerts.push({
        id: `alert-${generateId()}`,
        nodeId: node.id,
        nodeName: node.displayName,
        region: node.region,
        severity,
        type: 'disk_full',
        message: `Disk usage at ${node.metrics.disk.toFixed(1)}%`,
        detail: `Disk usage approaching capacity. Risk of service interruption.`,
        timestamp: new Date(),
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
        assignedTo: null,
        notes: [],
        relatedAlertIds: [],
        resolvedAt: null,
        tags: node.tags,
      });
      markAlerted(node.id, 'disk_full');
    }
  }

  return newAlerts;
}
