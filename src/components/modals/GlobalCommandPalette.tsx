import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { LayoutDashboard, Network, Zap, Bell, FileWarning, MessageSquare, Settings, Server, AlertTriangle, X } from 'lucide-react';
import { useStore } from '@/store';
import { getSeverityColor } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/infrastructure', label: 'Infrastructure', icon: Network },
  { path: '/predictions', label: 'Predictions', icon: Zap },
  { path: '/alerts', label: 'Alerts Center', icon: Bell },
  { path: '/incidents', label: 'Incident History', icon: FileWarning },
  { path: '/ai-chat', label: 'AI Chat', icon: MessageSquare },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function GlobalCommandPalette() {
  const navigate = useNavigate();
  const { ui, setCommandOpen, nodes, alerts } = useStore();

  function go(path: string) {
    navigate(path);
    setCommandOpen(false);
  }

  return (
    <Dialog.Root open={ui.commandOpen} onOpenChange={setCommandOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
        <Dialog.Content
          className="fixed left-1/2 top-[20%] -translate-x-1/2 z-50 w-full max-w-xl rounded-2xl overflow-hidden"
          style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
        >
          <Command className="flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
              <Network size={16} className="text-slate-400" />
              <Command.Input
                placeholder="Search nodes, alerts, pages..."
                className="flex-1 bg-transparent text-slate-700 placeholder-slate-400 outline-none text-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
              <button onClick={() => setCommandOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
            <Command.List className="max-h-80 overflow-y-auto py-2">
              <Command.Empty className="py-8 text-center text-sm text-slate-400">
                No results found.
              </Command.Empty>

              <Command.Group heading={<span className="px-4 py-1 text-[10px] uppercase tracking-wider text-slate-400">Pages</span>}>
                {NAV_ITEMS.map((item) => (
                  <Command.Item
                    key={item.path}
                    value={item.label}
                    onSelect={() => go(item.path)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 cursor-pointer aria-selected:bg-slate-100 aria-selected:text-[#6366f1] hover:bg-slate-50 transition-colors"
                  >
                    <item.icon size={14} className="flex-shrink-0" />
                    {item.label}
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Separator className="border-t border-slate-200 my-1" />

              <Command.Group heading={<span className="px-4 py-1 text-[10px] uppercase tracking-wider text-slate-400">Nodes</span>}>
                {nodes.map((node) => (
                  <Command.Item
                    key={node.id}
                    value={`${node.displayName} ${node.id}`}
                    onSelect={() => go(`/infrastructure`)}
                    className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-600 cursor-pointer aria-selected:bg-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Server size={14} className="flex-shrink-0 text-slate-400" />
                      {node.displayName}
                    </div>
                    <span className="text-xs" style={{ color: node.status === 'healthy' ? '#10b981' : node.status === 'warning' ? '#f59e0b' : '#ef4444' }}>
                      {node.status}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>

              {alerts.length > 0 && (
                <>
                  <Command.Separator className="border-t border-slate-200 my-1" />
                  <Command.Group heading={<span className="px-4 py-1 text-[10px] uppercase tracking-wider text-slate-400">Recent Alerts</span>}>
                    {alerts.slice(0, 5).map((alert) => (
                      <Command.Item
                        key={alert.id}
                        value={`${alert.nodeName} ${alert.message}`}
                        onSelect={() => go('/alerts')}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 cursor-pointer aria-selected:bg-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <AlertTriangle size={14} className="flex-shrink-0" style={{ color: getSeverityColor(alert.severity) }} />
                        <span className="truncate">{alert.nodeName}: {alert.message}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                </>
              )}
            </Command.List>
            <div className="border-t border-slate-200 px-4 py-2 flex items-center gap-4 text-[10px] text-slate-400 bg-slate-50">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>esc close</span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
