import { create } from 'zustand';
import type { CloudNode, Alert, AIPrediction, Incident, AppSettings, TeamMember } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
  anthropicApiKey: localStorage.getItem('cloudguard-api-key') || '',
  simulationInterval: 8000,
  faultFrequency: 'medium',
  nodeCount: 12,
  cpuWarningThreshold: 75,
  memoryWarningThreshold: 80,
  errorRateThreshold: 2,
  diskWarningThreshold: 85,
  accentColor: 'indigo',
  fontSize: 'default',
  enableSoundAlerts: false,
  enableDesktopNotifications: false,
  alertRetentionHours: 24,
};

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm1', name: 'Alice Chen', initials: 'AC', role: 'SRE Lead', avatarColor: 'bg-indigo-600', alertCount: 0, status: 'online' },
  { id: 'tm2', name: 'Bob Martinez', initials: 'BM', role: 'DevOps Engineer', avatarColor: 'bg-violet-600', alertCount: 0, status: 'online' },
  { id: 'tm3', name: 'Sarah Kim', initials: 'SK', role: 'Platform Engineer', avatarColor: 'bg-emerald-600', alertCount: 0, status: 'away' },
];

interface AppStore {
  nodes: CloudNode[];
  alerts: Alert[];
  predictions: AIPrediction[];
  incidents: Incident[];
  settings: AppSettings;
  team: TeamMember[];
  systemHealthScore: number;
  ui: {
    sidebarExpanded: boolean;
    activeModal: string | null;
    globalSearchQuery: string;
    commandOpen: boolean;
    selectedNodeId: string | null;
    selectedAlertId: string | null;
  };

  // Node actions
  setNodes: (nodes: CloudNode[]) => void;
  updateNode: (id: string, updates: Partial<CloudNode>) => void;

  // Alert actions
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (id: string, by?: string) => void;
  resolveAlert: (id: string) => void;
  addNoteToAlert: (id: string, note: string) => void;
  assignAlert: (id: string, member: TeamMember) => void;
  setAlerts: (alerts: Alert[]) => void;

  // Prediction actions
  addPrediction: (prediction: AIPrediction) => void;
  updatePrediction: (id: string, updates: Partial<AIPrediction>) => void;
  setPredictions: (predictions: AIPrediction[]) => void;

  // Incident actions
  setIncidents: (incidents: Incident[]) => void;
  addIncident: (incident: Incident) => void;

  // Settings actions
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Team actions
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;

  // System health
  setSystemHealthScore: (score: number) => void;

  // UI actions
  setCommandOpen: (open: boolean) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedAlertId: (id: string | null) => void;
  setGlobalSearchQuery: (query: string) => void;
}

export const useStore = create<AppStore>((set, get) => ({
  nodes: [],
  alerts: [],
  predictions: [],
  incidents: [],
  settings: DEFAULT_SETTINGS,
  team: TEAM_MEMBERS,
  systemHealthScore: 100,
  ui: {
    sidebarExpanded: false,
    activeModal: null,
    globalSearchQuery: '',
    commandOpen: false,
    selectedNodeId: null,
    selectedAlertId: null,
  },

  setNodes: (nodes) => set({ nodes }),
  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  addAlert: (alert) =>
    set((state) => {
      const existing = state.alerts.find(
        (a) => a.nodeId === alert.nodeId && a.type === alert.type &&
          Date.now() - new Date(a.timestamp).getTime() < 60000
      );
      if (existing) return state;
      const newAlerts = [alert, ...state.alerts].slice(0, 200);
      // Update team alert counts
      const teamCounts: Record<string, number> = {};
      newAlerts.forEach((a) => {
        if (a.assignedTo) {
          teamCounts[a.assignedTo.id] = (teamCounts[a.assignedTo.id] || 0) + 1;
        }
      });
      return { alerts: newAlerts };
    }),

  acknowledgeAlert: (id, by = 'JD') =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id
          ? { ...a, acknowledged: true, acknowledgedBy: by, acknowledgedAt: new Date() }
          : a
      ),
    })),

  resolveAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, resolvedAt: new Date() } : a
      ),
    })),

  addNoteToAlert: (id, note) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, notes: [...a.notes, note] } : a
      ),
    })),

  assignAlert: (id, member) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, assignedTo: member } : a
      ),
    })),

  setAlerts: (alerts) => set({ alerts }),

  addPrediction: (prediction) =>
    set((state) => ({ predictions: [prediction, ...state.predictions].slice(0, 50) })),

  updatePrediction: (id, updates) =>
    set((state) => ({
      predictions: state.predictions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  setPredictions: (predictions) => set({ predictions }),

  setIncidents: (incidents) => set({ incidents }),
  addIncident: (incident) =>
    set((state) => ({ incidents: [incident, ...state.incidents] })),

  updateSetting: (key, value) => {
    const newSettings = { ...get().settings, [key]: value };
    if (key === 'anthropicApiKey') {
      localStorage.setItem('cloudguard-api-key', value as string);
    }
    set({ settings: newSettings });
  },

  updateSettings: (updates) => {
    const newSettings = { ...get().settings, ...updates };
    if (updates.anthropicApiKey !== undefined) {
      localStorage.setItem('cloudguard-api-key', updates.anthropicApiKey);
    }
    set({ settings: newSettings });
  },

  updateTeamMember: (id, updates) =>
    set((state) => ({
      team: state.team.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  setSystemHealthScore: (score) => set({ systemHealthScore: score }),

  setCommandOpen: (open) =>
    set((state) => ({ ui: { ...state.ui, commandOpen: open } })),

  setSelectedNodeId: (id) =>
    set((state) => ({ ui: { ...state.ui, selectedNodeId: id } })),

  setSelectedAlertId: (id) =>
    set((state) => ({ ui: { ...state.ui, selectedAlertId: id } })),

  setGlobalSearchQuery: (query) =>
    set((state) => ({ ui: { ...state.ui, globalSearchQuery: query } })),
}));
