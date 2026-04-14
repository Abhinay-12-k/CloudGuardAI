import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useStore } from '@/store';
import { initializeNodes, tickNodeMetrics, computeServiceStatus, computeSystemHealth, SERVICES } from '@/lib/simulationEngine';
import { generateAlerts } from '@/lib/alertEngine';
import type { CloudService } from '@/types';

// Module-level singleton to prevent multiple simulations
let simulationInitialized = false;
let globalServices: CloudService[] = [];
let globalIsLoading = true;

export function useCloudSimulation() {
  const { settings, setNodes, addAlert, setSystemHealthScore } = useStore();
  const nodes = useStore((s) => s.nodes);
  const systemHealthScore = useStore((s) => s.systemHealthScore);
  const [isLoading, setIsLoading] = useState(globalIsLoading);
  const [services, setServices] = useState<CloudService[]>(globalServices);
  const previousNodesRef = useRef(nodes);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isOwner = useRef(false);

  // Only the first caller initializes the simulation
  useEffect(() => {
    if (simulationInitialized) {
      setIsLoading(false);
      setServices(globalServices);
      return;
    }

    simulationInitialized = true;
    isOwner.current = true;

    const initialNodes = initializeNodes();
    setNodes(initialNodes);
    previousNodesRef.current = initialNodes;

    const initialServices = SERVICES.map((s) => computeServiceStatus(s, initialNodes));
    globalServices = initialServices;
    setServices(initialServices);

    const score = computeSystemHealth(initialNodes);
    setSystemHealthScore(score);

    const timer = setTimeout(() => {
      globalIsLoading = false;
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Only the owner runs the interval
  useEffect(() => {
    if (!isOwner.current || isLoading) return;

    intervalRef.current = setInterval(() => {
      const currentNodes = useStore.getState().nodes;
      const currentSettings = useStore.getState().settings;

      const updatedNodes = currentNodes.map((node) =>
        tickNodeMetrics(node, currentSettings.faultFrequency)
      );

      const newAlerts = generateAlerts(updatedNodes, previousNodesRef.current, {
        cpuWarningThreshold: currentSettings.cpuWarningThreshold,
        memoryWarningThreshold: currentSettings.memoryWarningThreshold,
        errorRateThreshold: currentSettings.errorRateThreshold,
        diskWarningThreshold: currentSettings.diskWarningThreshold,
      });

      newAlerts.forEach((alert) => {
        addAlert(alert);
        if (alert.severity === 'critical') {
          toast.error(`${alert.nodeName}: ${alert.message}`, {
            style: { borderLeft: '4px solid #ef4444', background: '#ffffff', border: '1px solid #fecaca', color: '#334155' },
            duration: 6000,
          });
        }
      });

      setNodes(updatedNodes);
      previousNodesRef.current = updatedNodes;

      const newServices = SERVICES.map((s) => computeServiceStatus(s, updatedNodes));
      globalServices = newServices;
      setServices(newServices);

      const score = computeSystemHealth(updatedNodes);
      setSystemHealthScore(score);
    }, settings.simulationInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLoading, settings.simulationInterval]);

  return { nodes, services, systemHealthScore, isLoading };
}
