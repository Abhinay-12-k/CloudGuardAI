import { useState } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useStore, TEAM_MEMBERS } from '@/store';
import { testApiConnection } from '@/lib/claudeApi';
import type { TeamMember } from '@/types';

const ACCENT_COLORS = [
  { id: 'indigo' as const, hex: '#6366f1', label: 'Indigo' },
  { id: 'purple' as const, hex: '#8b5cf6', label: 'Purple' },
  { id: 'cyan' as const, hex: '#06b6d4', label: 'Cyan' },
  { id: 'emerald' as const, hex: '#10b981', label: 'Emerald' },
];

function Slider({ label, value, onChange, min, max, step, unit }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex justify-between mb-2">
        <label className="text-sm text-slate-600">{label}</label>
        <span className="text-sm font-semibold text-amber-500">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: '#6366f1' }}
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export function Settings() {
  const { settings, updateSetting, team, updateTeamMember } = useStore();
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<TeamMember>>({});

  async function testConnection() {
    if (!settings.anthropicApiKey) return;
    setTesting(true);
    setConnectionStatus('idle');
    try {
      await testApiConnection(settings.anthropicApiKey);
      setConnectionStatus('success');
    } catch (err) {
      setConnectionStatus('error');
      setConnectionError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setTesting(false);
    }
  }

  function saveApiKey() {
    localStorage.setItem('cloudguard-api-key', settings.anthropicApiKey);
    toast.success('Settings saved successfully', {
      style: { borderLeft: '4px solid #10b981', background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155' },
    });
  }

  const sectionStyle = "rounded-2xl border border-slate-200 bg-white p-6 mb-6 shadow-sm";

  return (
    <PageWrapper title="Settings">
      <div className="max-w-2xl">
        {/* API Configuration */}
        <div className={sectionStyle}>
          <h3 className="section-header-accent text-sm font-semibold text-slate-800 mb-5">API Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Anthropic API Key</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={settings.anthropicApiKey}
                    onChange={(e) => updateSetting('anthropicApiKey', e.target.value)}
                    placeholder="sk-ant-api03-..."
                    className="w-full rounded-xl px-4 py-2.5 text-sm pr-10 outline-none input-base"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button
                  onClick={testConnection}
                  disabled={!settings.anthropicApiKey || testing}
                  className="px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40 whitespace-nowrap border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {testing ? <><Loader2 size={14} className="animate-spin inline mr-1" />Testing...</> : 'Test Connection'}
                </button>
              </div>
              {connectionStatus === 'success' && (
                <p className="text-xs flex items-center gap-1 mt-2 text-emerald-600">
                  <CheckCircle size={12} /> Connected — claude-sonnet-4-20250514 responding
                </p>
              )}
              {connectionStatus === 'error' && (
                <p className="text-xs flex items-center gap-1 mt-2 text-red-500">
                  <XCircle size={12} /> {connectionError}
                </p>
              )}
            </div>
            <button onClick={saveApiKey} className="btn-gradient text-white px-6 py-2.5 rounded-xl text-sm font-medium">
              Save API Key
            </button>
          </div>
        </div>

        {/* Simulation Settings */}
        <div className={sectionStyle}>
          <h3 className="section-header-accent text-sm font-semibold text-slate-800 mb-5">Simulation Settings</h3>

          <Slider
            label="Update Interval"
            value={settings.simulationInterval / 1000}
            onChange={(v) => updateSetting('simulationInterval', v * 1000)}
            min={5} max={30} step={1} unit="s"
          />

          <div className="mb-5">
            <label className="text-sm text-slate-600 mb-2 block">Fault Frequency</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((freq) => {
                const colors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
                const bgColors = { low: '#f0fdf4', medium: '#fffbeb', high: '#fef2f2' };
                const borderColors = { low: '#bbf7d0', medium: '#fde68a', high: '#fecaca' };
                const isActive = settings.faultFrequency === freq;
                return (
                  <button
                    key={freq}
                    onClick={() => updateSetting('faultFrequency', freq)}
                    className="flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-colors border"
                    style={{
                      borderColor: isActive ? borderColors[freq] : '#e2e8f0',
                      color: isActive ? colors[freq] : '#94a3b8',
                      background: isActive ? bgColors[freq] : 'transparent',
                    }}
                  >
                    {freq}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-5">
            <label className="text-sm text-slate-600 mb-2 block">Node Count</label>
            <div className="flex gap-2">
              {([6, 12, 18] as const).map((count) => {
                const isActive = settings.nodeCount === count;
                return (
                  <button
                    key={count}
                    onClick={() => updateSetting('nodeCount', count)}
                    className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors border"
                    style={{
                      borderColor: isActive ? '#c7d2fe' : '#e2e8f0',
                      color: isActive ? '#6366f1' : '#94a3b8',
                      background: isActive ? '#ede9fe' : 'transparent',
                    }}
                  >
                    {count} nodes
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Alert Thresholds */}
        <div className={sectionStyle}>
          <h3 className="section-header-accent text-sm font-semibold text-slate-800 mb-5">Alert Thresholds</h3>
          <Slider label="CPU Warning" value={settings.cpuWarningThreshold} onChange={(v) => updateSetting('cpuWarningThreshold', v)} min={50} max={95} step={1} unit="%" />
          <Slider label="Memory Warning" value={settings.memoryWarningThreshold} onChange={(v) => updateSetting('memoryWarningThreshold', v)} min={50} max={95} step={1} unit="%" />
          <Slider label="Error Rate Warning" value={settings.errorRateThreshold} onChange={(v) => updateSetting('errorRateThreshold', v)} min={0.5} max={10} step={0.1} unit="%" />
          <Slider label="Disk Warning" value={settings.diskWarningThreshold} onChange={(v) => updateSetting('diskWarningThreshold', v)} min={60} max={98} step={1} unit="%" />
        </div>

        {/* Appearance */}
        <div className={sectionStyle}>
          <h3 className="section-header-accent text-sm font-semibold text-slate-800 mb-5">Appearance</h3>

          <div className="mb-5">
            <label className="text-sm text-slate-600 mb-3 block">Accent Color</label>
            <div className="flex gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => {
                    updateSetting('accentColor', color.id);
                    document.documentElement.style.setProperty('--accent-color', color.hex);
                  }}
                  className="flex flex-col items-center gap-1 group"
                  title={color.label}
                >
                  <div
                    className="w-10 h-10 rounded-xl transition-all"
                    style={{
                      background: color.hex,
                      boxShadow: settings.accentColor === color.id ? `0 0 0 2px #ffffff, 0 0 0 4px ${color.hex}` : 'none',
                    }}
                  />
                  <span className="text-[10px] text-slate-400">{color.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="text-sm text-slate-600 mb-2 block">Font Size</label>
            <div className="flex gap-2">
              {(['compact', 'default', 'comfortable'] as const).map((size) => {
                const px = { compact: '13px', default: '14px', comfortable: '16px' };
                return (
                  <button
                    key={size}
                    onClick={() => {
                      updateSetting('fontSize', size);
                      document.documentElement.style.setProperty('--font-size-base', px[size]);
                    }}
                    className="flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-colors border"
                    style={{
                      borderColor: settings.fontSize === size ? '#c7d2fe' : '#e2e8f0',
                      color: settings.fontSize === size ? '#6366f1' : '#94a3b8',
                      background: settings.fontSize === size ? '#ede9fe' : 'transparent',
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: 'enableSoundAlerts' as const, label: 'Sound Alerts' },
              { key: 'enableDesktopNotifications' as const, label: 'Desktop Notifications' },
            ].map((setting) => (
              <label key={setting.key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-600">{setting.label}</span>
                <div
                  onClick={() => {
                    if (setting.key === 'enableDesktopNotifications' && !settings[setting.key]) {
                      Notification.requestPermission();
                    }
                    updateSetting(setting.key, !settings[setting.key]);
                  }}
                  className="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
                  style={{ background: settings[setting.key] ? '#6366f1' : '#e2e8f0' }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
                    style={{ transform: `translateX(${settings[setting.key] ? '22px' : '2px'})` }}
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Team Members */}
        <div className={sectionStyle}>
          <h3 className="section-header-accent text-sm font-semibold text-slate-800 mb-5">Team Members</h3>
          <div>
            {team.map((member) => (
              <div key={member.id} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0 ${member.avatarColor}`}>
                  {member.initials}
                </div>
                {editingId === member.id ? (
                  <div className="flex gap-2 flex-1">
                    <input
                      value={editValues.name ?? member.name}
                      onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                      className="flex-1 rounded-lg px-2 py-1 text-sm outline-none input-base border-[#6366f1]"
                    />
                    <input
                      value={editValues.role ?? member.role}
                      onChange={(e) => setEditValues((v) => ({ ...v, role: e.target.value }))}
                      className="w-32 rounded-lg px-2 py-1 text-sm outline-none input-base"
                    />
                    <button
                      onClick={() => {
                        updateTeamMember(member.id, editValues);
                        setEditingId(null);
                        setEditValues({});
                      }}
                      className="text-xs px-2 py-1 rounded text-emerald-600"
                    >
                      ✓ Save
                    </button>
                  </div>
                ) : (
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{member.name}</p>
                    <p className="text-xs text-slate-400">{member.role}</p>
                  </div>
                )}
                <button
                  onClick={() => { setEditingId(member.id); setEditValues({}); }}
                  className="text-slate-400 hover:text-[#6366f1] transition-colors"
                >
                  <Pencil size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default Settings;
