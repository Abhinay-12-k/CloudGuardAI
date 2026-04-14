import type { CloudNode, CloudService, NodeMetrics, NodeStatus, NodeType, Region } from '@/types';
import { clamp, randomInRange } from './utils';

export const NODE_SEEDS: Omit<CloudNode, 'metrics' | 'status' | 'history' | 'faultImminent' | 'criticalTicks'>[] = [
  { id: 'web-01',     displayName: 'Web Server 01',    name: 'web-01',     region: 'us-east-1',  type: 'web-server',    provider: 'AWS',   az: 'us-east-1a', tags: ['production', 'tier-1'], uptime: 99.94, uptimeSeconds: 8635200, lastIncident: null },
  { id: 'web-02',     displayName: 'Web Server 02',    name: 'web-02',     region: 'us-east-1',  type: 'web-server',    provider: 'AWS',   az: 'us-east-1b', tags: ['production', 'tier-1'], uptime: 99.97, uptimeSeconds: 8635200, lastIncident: null },
  { id: 'db-primary', displayName: 'DB Primary',       name: 'db-primary', region: 'us-east-1',  type: 'database',      provider: 'AWS',   az: 'us-east-1a', tags: ['production', 'critical'], uptime: 99.99, uptimeSeconds: 8635200, lastIncident: null },
  { id: 'db-replica', displayName: 'DB Replica',       name: 'db-replica', region: 'eu-west-2',  type: 'database',      provider: 'AWS',   az: 'eu-west-2b', tags: ['production'], uptime: 99.98, uptimeSeconds: 8635200, lastIncident: null },
  { id: 'cache-01',   displayName: 'Redis Cache 01',   name: 'cache-01',   region: 'us-east-1',  type: 'cache',         provider: 'AWS',   az: 'us-east-1a', tags: ['production'], uptime: 99.91, uptimeSeconds: 8635200, lastIncident: null },
  { id: 'cache-02',   displayName: 'Redis Cache 02',   name: 'cache-02',   region: 'eu-west-2',  type: 'cache',         provider: 'GCP',   az: 'eu-west-2a', tags: ['production'], uptime: 99.88, uptimeSeconds: 8635200, lastIncident: null },
  { id: 'lb-us',      displayName: 'Load Balancer US', name: 'lb-us',      region: 'us-east-1',  type: 'load-balancer', provider: 'AWS',   az: 'us-east-1c', tags: ['production', 'tier-1'], uptime: 100, uptimeSeconds: 8635200, lastIncident: null },
  { id: 'lb-eu',      displayName: 'Load Balancer EU', name: 'lb-eu',      region: 'eu-west-2',  type: 'load-balancer', provider: 'AWS',   az: 'eu-west-2a', tags: ['production', 'tier-1'], uptime: 99.96, uptimeSeconds: 8635200, lastIncident: null },
  { id: 'queue-01',   displayName: 'Message Queue',    name: 'queue-01',   region: 'us-east-1',  type: 'queue',         provider: 'AWS',   az: 'us-east-1b', tags: ['production'], uptime: 99.93, uptimeSeconds: 8635200, lastIncident: null },
  { id: 'api-gw-us',  displayName: 'API Gateway US',   name: 'api-gw-us',  region: 'us-east-1',  type: 'api-gateway',   provider: 'AWS',   az: 'us-east-1a', tags: ['production', 'tier-1'], uptime: 99.95, uptimeSeconds: 8635200, lastIncident: null },
  { id: 'api-gw-eu',  displayName: 'API Gateway EU',   name: 'api-gw-eu',  region: 'eu-west-2',  type: 'api-gateway',   provider: 'Azure', az: 'eu-west-2b', tags: ['production', 'tier-1'], uptime: 99.97, uptimeSeconds: 8635200, lastIncident: null },
  { id: 'api-gw-ap',  displayName: 'API Gateway AP',   name: 'api-gw-ap',  region: 'ap-south-1', type: 'api-gateway',   provider: 'GCP',   az: 'ap-south-1a', tags: ['production'], uptime: 99.89, uptimeSeconds: 8635200, lastIncident: null },
];

type MetricProfile = { cpu: [number, number]; mem: [number, number]; disk: [number, number]; latency: [number, number]; errRate: [number, number]; rps: [number, number] };

const METRIC_PROFILES: Record<NodeType, MetricProfile> = {
  'web-server':    { cpu: [20, 45], mem: [40, 65], disk: [30, 50], latency: [8, 25],  errRate: [0, 0.5], rps: [200, 800] },
  'database':      { cpu: [15, 40], mem: [55, 80], disk: [40, 70], latency: [2, 8],   errRate: [0, 0.1], rps: [50, 200] },
  'load-balancer': { cpu: [5, 20],  mem: [15, 35], disk: [10, 20], latency: [1, 5],   errRate: [0, 0.2], rps: [1000, 5000] },
  'cache':         { cpu: [10, 30], mem: [60, 85], disk: [20, 40], latency: [1, 3],   errRate: [0, 0.3], rps: [500, 2000] },
  'queue':         { cpu: [15, 35], mem: [30, 55], disk: [25, 45], latency: [5, 15],  errRate: [0, 0.4], rps: [100, 500] },
  'api-gateway':   { cpu: [25, 50], mem: [35, 60], disk: [15, 30], latency: [10, 30], errRate: [0, 0.8], rps: [300, 1200] },
};

export function generateInitialMetrics(nodeType: NodeType): NodeMetrics {
  const p = METRIC_PROFILES[nodeType];
  return {
    cpu: randomInRange(p.cpu[0], p.cpu[1]),
    memory: randomInRange(p.mem[0], p.mem[1]),
    disk: randomInRange(p.disk[0], p.disk[1]),
    networkLatency: randomInRange(p.latency[0], p.latency[1]),
    networkIn: randomInRange(1, 50),
    networkOut: randomInRange(0.5, 30),
    errorRate: randomInRange(p.errRate[0], p.errRate[1]),
    requestsPerSec: randomInRange(p.rps[0], p.rps[1]),
    activeConnections: Math.floor(randomInRange(10, 500)),
    temperature: randomInRange(45, 70),
  };
}

export function calculateNodeHealth(node: CloudNode): number {
  const { cpu, memory, disk, errorRate, networkLatency } = node.metrics;
  const weights = { cpu: 0.30, memory: 0.25, disk: 0.15, errorRate: 0.20, latency: 0.10 };
  const cpuScore = cpu > 90 ? 0 : cpu > 75 ? 50 : cpu > 60 ? 75 : 100;
  const memScore = memory > 90 ? 0 : memory > 80 ? 50 : memory > 65 ? 80 : 100;
  const diskScore = disk > 95 ? 0 : disk > 85 ? 40 : disk > 70 ? 75 : 100;
  const errScore = errorRate > 5 ? 0 : errorRate > 2 ? 50 : errorRate > 1 ? 75 : 100;
  const latencyBaseline: Record<NodeType, number> = {
    'web-server': 30, 'database': 10, 'load-balancer': 5,
    'cache': 5, 'queue': 20, 'api-gateway': 40,
  };
  const baseline = latencyBaseline[node.type];
  const latScore = networkLatency > baseline * 4 ? 0 : networkLatency > baseline * 2 ? 60 : 100;
  return Math.round(
    cpuScore * weights.cpu + memScore * weights.memory + diskScore * weights.disk +
    errScore * weights.errorRate + latScore * weights.latency
  );
}

export function deriveStatus(healthScore: number): NodeStatus {
  if (healthScore >= 85) return 'healthy';
  if (healthScore >= 60) return 'warning';
  if (healthScore >= 30) return 'critical';
  return 'failed';
}

export function tickNodeMetrics(
  node: CloudNode,
  faultFrequency: 'low' | 'medium' | 'high'
): CloudNode {
  const faultChance = faultFrequency === 'low' ? 0.03 : faultFrequency === 'medium' ? 0.08 : 0.18;
  const hasFaultEvent = Math.random() < faultChance;

  const m = { ...node.metrics };

  // Normal fluctuation
  m.cpu = clamp(m.cpu + (Math.random() - 0.5) * 8, 2, 98);
  m.memory = clamp(m.memory + (Math.random() - 0.5) * 4, 5, 99);
  m.disk = clamp(m.disk + (Math.random() - 0.5) * 0.5, 5, 99);
  m.networkLatency = clamp(m.networkLatency + (Math.random() - 0.5) * 10, 0.5, 500);
  m.errorRate = clamp(m.errorRate + (Math.random() - 0.5) * 0.3, 0, 20);
  m.networkIn = clamp(m.networkIn + (Math.random() - 0.5) * 5, 0.1, 100);
  m.networkOut = clamp(m.networkOut + (Math.random() - 0.5) * 3, 0.1, 80);
  m.requestsPerSec = clamp(m.requestsPerSec + (Math.random() - 0.5) * 50, 1, 10000);
  m.activeConnections = clamp(m.activeConnections + Math.floor((Math.random() - 0.5) * 20), 0, 1000);
  m.temperature = clamp(m.temperature + (Math.random() - 0.5) * 2, 30, 95);

  // Fault injection
  if (hasFaultEvent) {
    m.cpu = clamp(m.cpu + randomInRange(20, 35), 2, 98);
    m.memory = clamp(m.memory + randomInRange(15, 25), 5, 99);
    m.errorRate = clamp(m.errorRate + randomInRange(1, 3), 0, 20);
  }

  // Recovery mechanism
  let criticalTicks = node.criticalTicks;
  const healthScore = calculateNodeHealth({ ...node, metrics: m });
  const newStatus = deriveStatus(healthScore);

  if (newStatus === 'critical' || newStatus === 'failed') {
    criticalTicks += 1;
    // Auto-recovery after 5 critical ticks
    if (criticalTicks >= 5 && Math.random() < 0.4) {
      const profile = METRIC_PROFILES[node.type];
      m.cpu = randomInRange(profile.cpu[0], profile.cpu[1]);
      m.memory = randomInRange(profile.mem[0], profile.mem[1]);
      m.errorRate = randomInRange(profile.errRate[0], profile.errRate[1]);
      criticalTicks = 0;
    }
  } else {
    criticalTicks = 0;
  }

  const finalHealthScore = calculateNodeHealth({ ...node, metrics: m });
  const finalStatus = deriveStatus(finalHealthScore);

  const newHistory = [...node.history, { ...m }].slice(-20);

  return {
    ...node,
    metrics: m,
    status: finalStatus,
    criticalTicks,
    faultImminent: finalStatus === 'critical' && criticalTicks >= 2,
    history: newHistory,
  };
}

export const SERVICES: Omit<CloudService, 'status' | 'uptime' | 'p99Latency' | 'errorBudgetRemaining'>[] = [
  { id: 'auth',    name: 'AuthService',        dependencies: ['api-gw-us', 'db-primary'],             sla: 99.9,  ownedBy: 'Platform',  version: 'v3.1.2', description: 'User authentication & session management', lastDeployed: new Date(Date.now() - 3 * 24 * 3600000) },
  { id: 'payment', name: 'PaymentService',     dependencies: ['api-gw-eu', 'db-primary', 'cache-01'], sla: 99.99, ownedBy: 'Payments',  version: 'v2.8.0', description: 'Payment processing & billing', lastDeployed: new Date(Date.now() - 7 * 24 * 3600000) },
  { id: 'order',   name: 'OrderService',       dependencies: ['web-01', 'web-02', 'queue-01'],         sla: 99.5,  ownedBy: 'Commerce',  version: 'v4.0.1', description: 'Order lifecycle management', lastDeployed: new Date(Date.now() - 1 * 24 * 3600000) },
  { id: 'notify',  name: 'NotificationService',dependencies: ['queue-01', 'api-gw-ap'],                sla: 99.0,  ownedBy: 'Platform',  version: 'v1.9.3', description: 'Email, SMS & push notifications', lastDeployed: new Date(Date.now() - 14 * 24 * 3600000) },
  { id: 'search',  name: 'SearchService',      dependencies: ['cache-01', 'cache-02'],                 sla: 99.5,  ownedBy: 'Discovery', version: 'v2.2.7', description: 'Full-text search & indexing', lastDeployed: new Date(Date.now() - 5 * 24 * 3600000) },
];

export function computeServiceStatus(service: typeof SERVICES[0], nodes: CloudNode[]): CloudService {
  const depNodes = service.dependencies.map((depId) => nodes.find((n) => n.id === depId)).filter(Boolean) as CloudNode[];

  let status: import('@/types').ServiceStatus = 'operational';
  if (depNodes.some((n) => n.status === 'critical' || n.status === 'failed')) {
    status = 'down';
  } else if (depNodes.some((n) => n.status === 'warning')) {
    status = 'degraded';
  }

  const p99Latency = depNodes.reduce((sum, n) => sum + n.metrics.networkLatency, 0) + 15;
  const uptimePercent = depNodes.length > 0
    ? depNodes.reduce((sum, n) => sum + n.uptime, 0) / depNodes.length
    : 100;
  const errorBudgetRemaining = clamp(
    ((uptimePercent - (service.sla - (service.sla - uptimePercent))) / (100 - service.sla)) * 100,
    0,
    100
  );

  return {
    ...service,
    status,
    uptime: Math.round(uptimePercent * 1000) / 1000,
    p99Latency: Math.round(p99Latency),
    errorBudgetRemaining: Math.round(errorBudgetRemaining),
  };
}

export function initializeNodes(): CloudNode[] {
  return NODE_SEEDS.map((seed) => {
    const metrics = generateInitialMetrics(seed.type);
    const tempNode = { ...seed, metrics, status: 'healthy' as NodeStatus, history: [], faultImminent: false, criticalTicks: 0 };
    const health = calculateNodeHealth(tempNode);
    const status = deriveStatus(health);
    return {
      ...tempNode,
      status,
      history: Array.from({ length: 20 }, () => generateInitialMetrics(seed.type)),
    };
  });
}

export function computeSystemHealth(nodes: CloudNode[]): number {
  if (nodes.length === 0) return 100;
  return Math.round(nodes.reduce((sum, n) => sum + calculateNodeHealth(n), 0) / nodes.length);
}
