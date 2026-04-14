import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { AlertsHourlyChart } from '@/components/charts/AlertsHourlyChart';
import { useStore, TEAM_MEMBERS } from '@/store';
import { getSeverityColor } from '@/lib/utils';
import type { Alert, TeamMember } from '@/types';
import { cn } from '@/lib/utils';

type Tab = 'All' | 'Critical' | 'Warning' | 'Info' | 'Acknowledged';

export function Alerts() {
  const { alerts, acknowledgeAlert, addNoteToAlert, assignAlert } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (activeTab === 'Acknowledged') return a.acknowledged;
      if (activeTab === 'Critical') return !a.acknowledged && a.severity === 'critical';
      if (activeTab === 'Warning') return !a.acknowledged && (a.severity === 'high' || a.severity === 'medium');
      if (activeTab === 'Info') return !a.acknowledged && (a.severity === 'low' || a.severity === 'info');
      return true;
    });
  }, [alerts, activeTab]);

  const selectedAlert = selectedAlertId ? alerts.find((a) => a.id === selectedAlertId) : null;

  function getTabCount(tab: Tab) {
    if (tab === 'Critical') return alerts.filter((a) => !a.acknowledged && a.severity === 'critical').length;
    if (tab === 'Warning') return alerts.filter((a) => !a.acknowledged && (a.severity === 'high' || a.severity === 'medium')).length;
    if (tab === 'Info') return alerts.filter((a) => !a.acknowledged && (a.severity === 'low' || a.severity === 'info')).length;
    if (tab === 'Acknowledged') return alerts.filter((a) => a.acknowledged).length;
    return alerts.length;
  }

  const criticalCount = alerts.filter((a) => !a.acknowledged && a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => !a.acknowledged && (a.severity === 'high' || a.severity === 'medium')).length;
  const todayCount = alerts.filter((a) => new Date(a.timestamp).toDateString() === new Date().toDateString()).length;

  return (
    <PageWrapper title="Alerts Center">
      <div className="grid grid-cols-5 gap-6">
        {/* Left: Alert Feed */}
        <div className="col-span-5 lg:col-span-3">
          {/* Tabs */}
          <div className="flex gap-1 p-1 mb-4 w-fit rounded-xl bg-slate-100 border border-slate-200">
            {(['All', 'Critical', 'Warning', 'Info', 'Acknowledged'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  activeTab === tab ? 'bg-[#6366f1] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab} ({getTabCount(tab)})
              </button>
            ))}
          </div>

          {/* Alerts */}
          <div className="space-y-2">
            <AnimatePresence>
              {filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border border-slate-200 rounded-2xl bg-white">
                  <AlertTriangle size={32} className="text-slate-300 mb-3" />
                  <p className="text-slate-400 font-medium">No alerts in this category</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: alert.acknowledged ? 0.5 : 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-xl bg-white cursor-pointer group hover:shadow-md transition-all relative overflow-hidden border border-slate-200"
                    onClick={() => setSelectedAlertId(alert.id)}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: getSeverityColor(alert.severity) }} />
                    <div className="pl-4 pr-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-sm font-medium text-slate-700">{alert.nodeName}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">{alert.region}</span>
                            <StatusBadge severity={alert.severity as import('@/types').Severity} compact />
                            {alert.acknowledged && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">Acknowledged</span>}
                          </div>
                          <p className="text-xs font-medium text-slate-600 mb-0.5">{alert.message}</p>
                          <p className="text-xs text-slate-400 leading-relaxed truncate">{alert.detail}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">{formatDistanceToNow(new Date(alert.timestamp))} ago</span>
                      </div>
                      {/* Hover actions */}
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!alert.acknowledged && (
                          <button
                            onClick={(e) => { e.stopPropagation(); acknowledgeAlert(alert.id); }}
                            className="text-xs px-3 py-1 rounded-lg transition-colors bg-emerald-50 text-emerald-600 border border-emerald-200"
                          >
                            ✓ Acknowledge
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedAlertId(alert.id); }}
                          className="text-xs px-3 py-1 rounded-lg transition-colors"
                          style={{ background: '#ede9fe', color: '#6366f1', border: '1px solid #ddd6fe' }}
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Stats + Team */}
        <div className="col-span-5 lg:col-span-2 space-y-4">
          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Critical', value: criticalCount, color: '#ef4444' },
              { label: 'Warning', value: warningCount, color: '#f59e0b' },
              { label: 'Alerts Today', value: todayCount, color: '#8b5cf6' },
              { label: 'Total Active', value: alerts.filter((a) => !a.acknowledged).length, color: '#6366f1' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl p-3 border border-slate-200 bg-white shadow-sm">
                <div className="text-2xl font-bold mb-0.5" style={{ color: stat.color }}>
                  <AnimatedNumber value={stat.value} />
                </div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Hourly chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="section-header-accent text-sm font-semibold text-slate-800 mb-3">Alerts by Hour</p>
            <AlertsHourlyChart alerts={alerts} />
          </div>

          {/* Team */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="section-header-accent text-sm font-semibold text-slate-800 mb-3">On-Call Team</p>
            <div>
              {TEAM_MEMBERS.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${member.avatarColor}`}>
                      {member.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.role}</p>
                    </div>
                    <div
                      className="w-2 h-2 rounded-full status-pulse"
                      style={{ background: member.status === 'online' ? '#10b981' : member.status === 'away' ? '#f59e0b' : '#94a3b8' }}
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-700">{alerts.filter((a) => a.assignedTo?.id === member.id).length}</span>
                    <p className="text-xs text-slate-400">alerts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Detail Dialog */}
      <Dialog.Root open={!!selectedAlert} onOpenChange={(o) => !o && setSelectedAlertId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
          >
            {selectedAlert && (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-slate-800 font-semibold">{selectedAlert.nodeName}</h3>
                      <StatusBadge severity={selectedAlert.severity as import('@/types').Severity} />
                    </div>
                    <p className="text-sm text-slate-600">{selectedAlert.message}</p>
                  </div>
                  <Dialog.Close asChild>
                    <button className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                  </Dialog.Close>
                </div>

                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-400 mb-1">Detail</p>
                    <p className="text-sm text-slate-600">{selectedAlert.detail}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><p className="text-slate-400">Region</p><p className="text-slate-700">{selectedAlert.region}</p></div>
                    <div><p className="text-slate-400">Type</p><p className="text-slate-700">{selectedAlert.type.replace(/_/g, ' ')}</p></div>
                    <div><p className="text-slate-400">Timestamp</p><p className="text-slate-700">{formatDistanceToNow(new Date(selectedAlert.timestamp))} ago</p></div>
                    <div><p className="text-slate-400">Status</p><p className="text-slate-700">{selectedAlert.acknowledged ? 'Acknowledged' : 'Active'}</p></div>
                  </div>

                  {/* Assign to */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Assign To</p>
                    <div className="flex gap-2 flex-wrap">
                      {TEAM_MEMBERS.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => assignAlert(selectedAlert.id, member)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors border',
                            selectedAlert.assignedTo?.id === member.id
                              ? 'border-[#6366f1] text-[#6366f1] bg-indigo-50'
                              : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                          )}
                        >
                          <span className={`w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center text-white ${member.avatarColor}`}>{member.initials}</span>
                          {member.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Notes ({selectedAlert.notes.length})</p>
                    {selectedAlert.notes.map((note, i) => (
                      <div key={i} className="text-xs text-slate-600 p-2 rounded mb-1 bg-slate-50 border border-slate-200">{note}</div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note..."
                        className="flex-1 input-base rounded-lg px-3 py-1.5 text-xs outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newNote.trim()) {
                            addNoteToAlert(selectedAlert.id, newNote.trim());
                            setNewNote('');
                          }
                        }}
                      />
                      <button
                        onClick={() => { if (newNote.trim()) { addNoteToAlert(selectedAlert.id, newNote.trim()); setNewNote(''); } }}
                        className="px-3 py-1.5 rounded-lg text-xs btn-gradient text-white"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2 border-t border-slate-200">
                    {!selectedAlert.acknowledged && (
                      <button
                        onClick={() => { acknowledgeAlert(selectedAlert.id); setSelectedAlertId(null); }}
                        className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors bg-emerald-50 text-emerald-600 border border-emerald-200"
                      >
                        ✓ Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </PageWrapper>
  );
}

export default Alerts;
