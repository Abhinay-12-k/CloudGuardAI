export type NodeStatus = 'healthy' | 'warning' | 'critical' | 'failed' | 'maintenance';
export type NodeType = 'web-server' | 'database' | 'load-balancer' | 'cache' | 'queue' | 'api-gateway';
export type Region = 'us-east-1' | 'eu-west-2' | 'ap-south-1';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'maintenance';

export interface NodeMetrics {
  cpu: number;
  memory: number;
  disk: number;
  networkLatency: number;
  networkIn: number;
  networkOut: number;
  errorRate: number;
  requestsPerSec: number;
  activeConnections: number;
  temperature: number;
}

export interface CloudNode {
  id: string;
  name: string;
  displayName: string;
  region: Region;
  type: NodeType;
  metrics: NodeMetrics;
  status: NodeStatus;
  uptime: number;
  uptimeSeconds: number;
  lastIncident: Date | null;
  faultImminent: boolean;
  criticalTicks: number;
  history: NodeMetrics[];
  tags: string[];
  provider: 'AWS' | 'GCP' | 'Azure';
  az: string;
}

export interface CloudService {
  id: string;
  name: string;
  description: string;
  dependencies: string[];
  status: ServiceStatus;
  uptime: number;
  sla: number;
  ownedBy: string;
  lastDeployed: Date;
  version: string;
  p99Latency: number;
  errorBudgetRemaining: number;
}

export interface Alert {
  id: string;
  nodeId: string;
  nodeName: string;
  region: Region;
  severity: Severity;
  type: 'cpu_spike' | 'memory_pressure' | 'high_latency' | 'error_rate' | 'node_down' | 'disk_full' | 'connection_limit' | 'prediction_triggered';
  message: string;
  detail: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: Date | null;
  assignedTo: TeamMember | null;
  notes: string[];
  relatedAlertIds: string[];
  resolvedAt: Date | null;
  tags: string[];
}

export interface AIPrediction {
  id: string;
  nodeId: string;
  nodeName: string;
  generatedAt: Date;
  faultType: string;
  severity: Severity;
  probability: number;
  confidence: number;
  estimatedTimeToFailure: string;
  rootCause: string;
  recommendation: string;
  immediateActions: string[];
  affectedServices: string[];
  metricsAtPrediction: NodeMetrics;
  status: 'active' | 'resolved' | 'verified' | 'missed' | 'false_positive';
  resolvedAt: Date | null;
  wasAccurate: boolean | null;
  anomalyScore?: number;
  similarIncidentPattern?: string;
}

export interface Incident {
  id: string;
  nodeId: string;
  nodeName: string;
  region: Region;
  type: string;
  severity: Severity;
  startedAt: Date;
  resolvedAt: Date | null;
  duration: number;
  status: 'resolved' | 'ongoing' | 'monitoring';
  trigger: string;
  aiPredicted: boolean;
  predictionAccuracy: number | null;
  resolutionSteps: string[];
  resolvedBy: string | null;
  impactedServices: string[];
  postmortemUrl: string | null;
  cost: number;
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatarColor: string;
  alertCount: number;
  status: 'online' | 'away' | 'offline';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: boolean;
}

export interface AppSettings {
  anthropicApiKey: string;
  simulationInterval: number;
  faultFrequency: 'low' | 'medium' | 'high';
  nodeCount: 6 | 12 | 18;
  cpuWarningThreshold: number;
  memoryWarningThreshold: number;
  errorRateThreshold: number;
  diskWarningThreshold: number;
  accentColor: 'indigo' | 'purple' | 'cyan' | 'emerald';
  fontSize: 'compact' | 'default' | 'comfortable';
  enableSoundAlerts: boolean;
  enableDesktopNotifications: boolean;
  alertRetentionHours: number;
}
