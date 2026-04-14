import type { AIPrediction, CloudNode, ChatMessage } from '@/types';

export async function predictNodeFault(node: CloudNode, apiKey: string): Promise<AIPrediction> {
  const systemPrompt = `You are a senior cloud reliability engineer with deep expertise in distributed systems, SRE practices, and fault analysis. Your task is to analyze server telemetry and predict potential failures with high precision.

Analyze the provided metrics and respond ONLY with a valid JSON object. Do not include any markdown, code blocks, explanation, or preamble. Return pure JSON only.

Required JSON structure:
{
  "faultType": "string (e.g., 'CPU Thermal Throttling', 'Memory Leak', 'Network Saturation', 'Disk I/O Bottleneck', 'Connection Pool Exhaustion', 'Cache Eviction Storm')",
  "severity": "critical | high | medium | low",
  "probability": number (0-100, integer),
  "confidence": number (0-100, how confident you are in this prediction),
  "estimatedTimeToFailure": "string (e.g., '~8 minutes', '30-45 minutes', '2-4 hours', 'Imminent (<5 min)')",
  "rootCause": "string (max 25 words, technical and specific)",
  "recommendation": "string (max 35 words, actionable and specific)",
  "immediateActions": ["string", "string", "string"],
  "affectedServices": ["string array of service names"],
  "anomalyScore": number (0-100),
  "similarIncidentPattern": "string (max 20 words)"
}`;

  const userMessage = `Analyze this cloud node for fault prediction:

Node: ${node.displayName} (${node.id})
Type: ${node.type}
Region: ${node.region} / AZ: ${node.az}
Provider: ${node.provider}
Current Status: ${node.status}
Fault Imminent Flag: ${node.faultImminent}
Critical for ${node.criticalTicks} consecutive ticks

Live Metrics:
- CPU Utilization: ${node.metrics.cpu.toFixed(1)}%
- Memory Utilization: ${node.metrics.memory.toFixed(1)}%
- Disk Utilization: ${node.metrics.disk.toFixed(1)}%
- Network Latency: ${node.metrics.networkLatency.toFixed(0)}ms
- Network In: ${node.metrics.networkIn.toFixed(1)} MB/s
- Network Out: ${node.metrics.networkOut.toFixed(1)} MB/s
- Error Rate: ${node.metrics.errorRate.toFixed(2)}%
- Requests/sec: ${node.metrics.requestsPerSec.toFixed(0)}
- Active Connections: ${node.metrics.activeConnections}

Metric Trends (last 5 snapshots, oldest→newest):
- CPU: [${node.history.slice(-5).map((h) => h.cpu.toFixed(0)).join(', ')}]
- Memory: [${node.history.slice(-5).map((h) => h.memory.toFixed(0)).join(', ')}]
- Error Rate: [${node.history.slice(-5).map((h) => h.errorRate.toFixed(2)).join(', ')}]
- Latency: [${node.history.slice(-5).map((h) => h.networkLatency.toFixed(0)).join(', ')}]

Tags: ${node.tags.join(', ')}
Uptime: ${node.uptime.toFixed(3)}%`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { error?: { message?: string } }).error?.message || `API request failed: ${response.status}`);
  }

  const data = await response.json();
  const rawText = (data.content[0]?.text as string) || '';
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format from AI');
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    id: `pred-${Date.now()}-${node.id}`,
    nodeId: node.id,
    nodeName: node.displayName,
    generatedAt: new Date(),
    metricsAtPrediction: { ...node.metrics },
    status: 'active',
    resolvedAt: null,
    wasAccurate: null,
    faultType: parsed.faultType || 'Unknown Fault',
    severity: parsed.severity || 'medium',
    probability: typeof parsed.probability === 'number' ? parsed.probability : 50,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 70,
    estimatedTimeToFailure: parsed.estimatedTimeToFailure || '~30 minutes',
    rootCause: parsed.rootCause || 'Analysis inconclusive',
    recommendation: parsed.recommendation || 'Monitor closely',
    immediateActions: Array.isArray(parsed.immediateActions) ? parsed.immediateActions : [],
    affectedServices: Array.isArray(parsed.affectedServices) ? parsed.affectedServices : [],
    anomalyScore: typeof parsed.anomalyScore === 'number' ? parsed.anomalyScore : 50,
    similarIncidentPattern: parsed.similarIncidentPattern || '',
  };
}

export async function testApiConnection(apiKey: string): Promise<void> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 20,
      messages: [{ role: 'user', content: 'Reply with only: "OK"' }],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { error?: { message?: string } }).error?.message || 'Connection failed');
  }
}

export async function sendChatMessage(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt: string,
  apiKey: string,
  onStream: (chunk: string) => void
): Promise<void> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { error?: { message?: string } }).error?.message || `Chat API request failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
    for (const line of lines) {
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'content_block_delta' && data.delta?.text) {
          onStream(data.delta.text);
        }
      } catch {
        // ignore parse errors
      }
    }
  }
}

export function buildChatSystemPrompt(
  nodes: import('@/types').CloudNode[],
  alerts: import('@/types').Alert[],
  predictions: AIPrediction[],
  systemHealthScore: number
): string {
  const criticalNodes = nodes.filter((n) => n.status === 'critical' || n.status === 'failed');
  const warningNodes = nodes.filter((n) => n.status === 'warning');
  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const activePredictions = predictions.filter((p) => p.status === 'active');

  return `You are CloudGuard AI, an expert cloud reliability and Site Reliability Engineering assistant. You have real-time access to the infrastructure data below.

Be concise, technical, and actionable. Format your responses with markdown when helpful. Prioritize the most critical issues. Speak like a senior SRE.

## Current Infrastructure State (as of ${new Date().toISOString()})

**System Health Score:** ${systemHealthScore}/100

**Critical Nodes (${criticalNodes.length}):**
${criticalNodes.map((n) => `- ${n.displayName} (${n.region}): CPU ${n.metrics.cpu.toFixed(1)}%, Mem ${n.metrics.memory.toFixed(1)}%, Error Rate ${n.metrics.errorRate.toFixed(2)}%`).join('\n') || 'None'}

**Warning Nodes (${warningNodes.length}):**
${warningNodes.map((n) => `- ${n.displayName}: CPU ${n.metrics.cpu.toFixed(1)}%, Mem ${n.metrics.memory.toFixed(1)}%`).join('\n') || 'None'}

**Active Unacknowledged Alerts (${activeAlerts.length}):**
${activeAlerts.slice(0, 5).map((a) => `- [${a.severity.toUpperCase()}] ${a.nodeName}: ${a.message}`).join('\n') || 'None'}

**Active AI Predictions (${activePredictions.length}):**
${activePredictions.map((p) => `- ${p.nodeName}: ${p.faultType} (${p.probability}% probability, ${p.estimatedTimeToFailure})`).join('\n') || 'None'}

**Full Node Metrics:**
${JSON.stringify(
  nodes.map((n) => ({
    id: n.id,
    name: n.displayName,
    status: n.status,
    region: n.region,
    cpu: n.metrics.cpu.toFixed(1),
    memory: n.metrics.memory.toFixed(1),
    errorRate: n.metrics.errorRate.toFixed(2),
    latency: n.metrics.networkLatency.toFixed(0),
  })),
  null,
  2
)}`;
}

// Needed for type import in buildChatSystemPrompt usage
export type { ChatMessage };
