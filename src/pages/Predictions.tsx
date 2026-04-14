import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Plus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { useStore } from '@/store';
import { useCloudSimulation } from '@/hooks/useCloudSimulation';
import { predictNodeFault } from '@/lib/claudeApi';
import { cn, getSeverityColor } from '@/lib/utils';
import type { CSSProperties } from 'react';
import type { AIPrediction, Severity } from '@/types';

function getProbColor(prob: number): string {
  if (prob >= 75) return '#ef4444';
  if (prob >= 50) return '#f59e0b';
  if (prob >= 25) return '#6366f1';
  return '#10b981';
}

const NEXT_SCAN_INTERVAL = 30;

export function Predictions() {
  const { nodes } = useCloudSimulation();
  const { predictions, settings, addPrediction, updatePrediction } = useStore();
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());
  const [nextScan, setNextScan] = useState(NEXT_SCAN_INTERVAL);
  const [lastScanned, setLastScanned] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [modalAnalyzing, setModalAnalyzing] = useState(false);
  const [modalResult, setModalResult] = useState<AIPrediction | null>(null);
  const [modalError, setModalError] = useState('');
  const queueRef = useRef<string[]>([]);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNextScan((prev) => {
        if (prev <= 1) {
          runAutoScan();
          return NEXT_SCAN_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [nodes, settings.anthropicApiKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
      predictions.forEach((p) => {
        if (p.status === 'active' && new Date(p.generatedAt).getTime() < thirtyMinsAgo) {
          updatePrediction(p.id, { status: 'missed' });
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [predictions]);

  const runPrediction = useCallback(async (nodeId: string) => {
    if (!settings.anthropicApiKey) return;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (analyzing.has(nodeId)) return;

    setAnalyzing((prev) => new Set([...prev, nodeId]));
    try {
      const prediction = await predictNodeFault(node, settings.anthropicApiKey);
      addPrediction(prediction);
      toast(`Prediction ready: ${node.displayName}`, {
        style: { borderLeft: '4px solid #8b5cf6', background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155' },
        description: `${prediction.faultType} · ${prediction.probability}% probability`,
      });
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setAnalyzing((prev) => { const s = new Set(prev); s.delete(nodeId); return s; });
    }
  }, [nodes, settings.anthropicApiKey, analyzing]);

  const runAutoScan = useCallback(() => {
    if (!settings.anthropicApiKey) return;
    const candidates = nodes.filter((n) =>
      n.status === 'critical' || n.status === 'failed' || n.faultImminent ||
      n.metrics.cpu > settings.cpuWarningThreshold ||
      n.metrics.memory > settings.memoryWarningThreshold ||
      n.metrics.errorRate > settings.errorRateThreshold
    );
    if (candidates.length === 0) return;
    setLastScanned(new Date());
    candidates.slice(0, 3).forEach((n) => { runPrediction(n.id); });
  }, [nodes, settings, runPrediction]);

  const activePredictions = predictions.filter((p) => p.status === 'active');
  const criticalCount = activePredictions.filter((p) => p.severity === 'critical').length;
  const highCount = activePredictions.filter((p) => p.severity === 'high').length;
  const medLowCount = activePredictions.filter((p) => p.severity === 'medium' || p.severity === 'low').length;
  const avgConf = activePredictions.length > 0
    ? Math.round(activePredictions.reduce((s, p) => s + p.confidence, 0) / activePredictions.length)
    : 0;

  async function runModalAnalysis() {
    if (!selectedNodeId || !settings.anthropicApiKey) return;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return;
    setModalAnalyzing(true);
    setModalResult(null);
    setModalError('');
    try {
      const result = await predictNodeFault(node, settings.anthropicApiKey);
      setModalResult(result);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setModalAnalyzing(false);
    }
  }

  function addModalResult() {
    if (modalResult) {
      addPrediction(modalResult);
      setModalOpen(false);
      setModalResult(null);
      toast(`Prediction added: ${modalResult.nodeName}`, {
        style: { borderLeft: '4px solid #8b5cf6', background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155' },
      });
    }
  }

  return (
    <PageWrapper title="Fault Predictions">
      {/* Summary strip */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: predictions.length, color: '#6366f1' },
            { label: 'Critical', value: criticalCount, color: '#ef4444' },
            { label: 'High', value: highCount, color: '#f59e0b' },
            { label: 'Med/Low', value: medLowCount, color: '#10b981' },
            { label: 'Avg Confidence', value: avgConf, suffix: '%', color: '#8b5cf6' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold" style={{ color: stat.color }}>
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>
            {lastScanned ? `Last scanned: ${formatDistanceToNow(lastScanned)} ago` : 'No scan yet'}
            {' · '}
            <span style={{ color: nextScan < 10 ? '#f59e0b' : '#94a3b8' }}>Next scan in {nextScan}s</span>
          </span>
          <div className="flex gap-2">
            <button onClick={runAutoScan} disabled={!settings.anthropicApiKey} className="btn-gradient text-white px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 flex items-center gap-1.5">
              <Zap size={12} /> Scan Now
            </button>
            <button onClick={() => { setModalOpen(true); setModalResult(null); setModalError(''); }} className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-[#6366f1] transition-colors" style={{ border: '1px solid #e2e8f0' }}>
              <Plus size={12} className="inline mr-1" /> Analyze Specific Node
            </button>
          </div>
        </div>
        {!settings.anthropicApiKey && (
          <p className="mt-2 text-xs text-amber-500">⚠ Configure your Anthropic API key in Settings to enable predictions</p>
        )}
      </div>

      {/* Active Predictions Grid */}
      <h3 className="section-header-accent text-sm font-semibold text-slate-800 mb-4">Active Predictions</h3>
      {activePredictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-slate-200 rounded-2xl mb-6 bg-white">
          <Zap size={32} className="text-slate-300 mb-3" />
          <p className="text-slate-400 font-medium">No active predictions</p>
          <p className="text-slate-300 text-sm mt-1">Click "Scan Now" to analyze nodes or wait for the auto-scan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <AnimatePresence>
            {activePredictions.map((pred) => (
              <motion.div
                key={pred.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn('rounded-2xl border border-slate-200 bg-white overflow-hidden ai-card-glow border-l-4 shadow-sm')}
                style={{ borderLeftColor: getSeverityColor(pred.severity) }}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">{pred.nodeName}</span>
                        <StatusBadge severity={pred.severity as Severity} compact />
                      </div>
                      <p className="text-xs text-[#8b5cf6] font-medium mt-0.5">{pred.faultType}</p>
                    </div>
                  </div>

                  {/* Probability gauge */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-medium">Fault Probability</span>
                      <span className="font-bold text-base" style={{ color: getProbColor(pred.probability) }}>{pred.probability}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-slate-200">
                      <div
                        className="h-full rounded-full bar-animated"
                        style={{ '--target-width': `${pred.probability}%`, width: `${pred.probability}%`, backgroundColor: getProbColor(pred.probability) } as CSSProperties}
                      />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Confidence: {pred.confidence}%</div>
                  </div>

                  {/* Time to failure */}
                  <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <Clock size={16} style={{ color: getSeverityColor(pred.severity) }} />
                    <div>
                      <p className="text-xs text-slate-400">Est. Time to Failure</p>
                      <p className="text-lg font-bold" style={{ color: getSeverityColor(pred.severity) }}>{pred.estimatedTimeToFailure}</p>
                    </div>
                  </div>

                  {/* Root cause */}
                  <div className="mb-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase mb-0.5">Root Cause</p>
                    <p className="text-xs text-slate-600">{pred.rootCause}</p>
                  </div>

                  {/* Recommendation */}
                  <div className="mb-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase mb-0.5">Recommendation</p>
                    <p className="text-xs text-slate-600">{pred.recommendation}</p>
                  </div>

                  {/* Immediate Actions */}
                  {pred.immediateActions.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-slate-400 uppercase mb-1">Immediate Actions</p>
                      <ol className="space-y-1">
                        {pred.immediateActions.map((action, i) => (
                          <li key={i} className="text-xs text-slate-600 flex gap-2">
                            <span className="text-[#6366f1] font-bold flex-shrink-0">{i + 1}.</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Affected Services */}
                  {pred.affectedServices.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {pred.affectedServices.map((s) => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-md" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed' }}>{s}</span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(pred.generatedAt))} ago</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updatePrediction(pred.id, { status: 'verified', wasAccurate: true })}
                        className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                        style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}
                      >
                        ✓ Acknowledge
                      </button>
                      <button
                        onClick={() => updatePrediction(pred.id, { status: 'false_positive', wasAccurate: false })}
                        className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                        style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Analyzing Nodes */}
      {analyzing.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[...analyzing].map((nodeId) => (
            <div key={nodeId} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed' }}>
              <Loader2 size={12} className="animate-spin" />
              Analyzing {nodes.find((n) => n.id === nodeId)?.displayName}...
            </div>
          ))}
        </div>
      )}

      {/* Prediction History */}
      <h3 className="section-header-accent text-sm font-semibold text-slate-800 mb-4">Prediction History</h3>
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Node', 'Fault Type', 'Severity', 'Probability', 'Generated', 'Outcome'].map((col) => (
                <th key={col} className="text-left px-4 py-3 text-slate-400 text-xs uppercase tracking-wider font-medium">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {predictions.slice(0, 10).map((pred) => (
              <tr key={pred.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-700">{pred.nodeName}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{pred.faultType}</td>
                <td className="px-4 py-3"><StatusBadge severity={pred.severity as Severity} compact /></td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: getProbColor(pred.probability) }}>{pred.probability}%</td>
                <td className="px-4 py-3 text-xs text-slate-400">{formatDistanceToNow(new Date(pred.generatedAt))} ago</td>
                <td className="px-4 py-3"><StatusBadge status={pred.status} compact /></td>
              </tr>
            ))}
            {predictions.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">No predictions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Prediction Modal */}
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg rounded-2xl p-6"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
          >
            <h3 className="text-slate-800 font-semibold mb-4">Analyze Specific Node</h3>
            <div className="mb-4">
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Select Node</label>
              <select
                value={selectedNodeId}
                onChange={(e) => setSelectedNodeId(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none input-base"
              >
                <option value="">-- Select a node --</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>{n.displayName} ({n.status})</option>
                ))}
              </select>
            </div>

            {selectedNodeId && !modalAnalyzing && !modalResult && (
              <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                {(() => {
                  const n = nodes.find((nd) => nd.id === selectedNodeId);
                  if (!n) return null;
                  return (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { label: 'CPU', value: `${n.metrics.cpu.toFixed(1)}%` },
                        { label: 'Memory', value: `${n.metrics.memory.toFixed(1)}%` },
                        { label: 'Errors', value: `${n.metrics.errorRate.toFixed(2)}%` },
                        { label: 'Latency', value: `${n.metrics.networkLatency.toFixed(0)}ms` },
                        { label: 'Status', value: n.status },
                        { label: 'Region', value: n.region },
                      ].map((m) => (
                        <div key={m.label}>
                          <p className="text-slate-400">{m.label}</p>
                          <p className="text-slate-700 font-medium">{m.value}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {modalAnalyzing && (
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader2 size={24} className="animate-spin text-[#8b5cf6]" />
                <p className="text-sm text-slate-500">Querying Claude AI...</p>
              </div>
            )}

            {modalError && (
              <div className="mb-4 p-3 rounded-xl flex items-center gap-2 bg-red-50 border border-red-200">
                <XCircle size={14} className="text-red-500" />
                <p className="text-xs text-red-500">{modalError}</p>
              </div>
            )}

            {modalResult && (
              <div className="mb-4 p-4 rounded-xl space-y-2 bg-slate-50 border border-violet-200">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-[#10b981]" />
                  <span className="text-xs text-[#10b981] font-medium">Analysis complete</span>
                </div>
                <p className="text-sm font-semibold text-[#8b5cf6]">{modalResult.faultType}</p>
                <p className="text-xs text-slate-600">Probability: <span className="font-bold" style={{ color: getProbColor(modalResult.probability) }}>{modalResult.probability}%</span> · ETF: {modalResult.estimatedTimeToFailure}</p>
                <p className="text-xs text-slate-400">{modalResult.rootCause}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Dialog.Close asChild>
                <button className="px-4 py-2 rounded-xl text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
              </Dialog.Close>
              {!modalResult ? (
                <button
                  onClick={runModalAnalysis}
                  disabled={!selectedNodeId || modalAnalyzing || !settings.anthropicApiKey}
                  className="btn-gradient text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 flex items-center gap-2"
                >
                  {modalAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  Run Analysis
                </button>
              ) : (
                <button onClick={addModalResult} className="btn-gradient text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                  <Plus size={14} /> Add to Predictions Board
                </button>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </PageWrapper>
  );
}

export default Predictions;
