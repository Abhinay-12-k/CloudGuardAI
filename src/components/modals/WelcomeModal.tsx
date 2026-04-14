import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Bell, BarChart2, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

const FEATURES = [
  {
    icon: Zap,
    color: '#8b5cf6',
    title: 'AI-Powered Fault Prediction',
    desc: 'Claude analyzes your infrastructure metrics in real-time to predict failures before they happen, with estimated time-to-failure and root cause analysis.',
  },
  {
    icon: Bell,
    color: '#ef4444',
    title: 'Intelligent Alert Routing',
    desc: 'Smart alert deduplication, severity classification, and team assignment ensure the right engineer sees the right alert at the right time.',
  },
  {
    icon: BarChart2,
    color: '#6366f1',
    title: 'Live Infrastructure Simulation',
    desc: 'A realistic 12-node cloud environment simulates real-world failure patterns so you can test and train without risking production systems.',
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const welcomed = localStorage.getItem('cloudguard-welcomed');
    if (!welcomed) {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem('cloudguard-welcomed', 'true');
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && dismiss()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-2xl p-6"
          style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
        >
          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={16} />
            </button>
          </Dialog.Close>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 15c0-3.31 2.69-6 6-6 .34 0 .68.03 1 .08C10.56 7.3 12.6 6 15 6c3.31 0 6 2.69 6 6 0 .34-.03.68-.08 1H21a3 3 0 010 6H6a3 3 0 01-3-3v-1z" fill="white" fillOpacity="0.9" />
                <path d="M10 13l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Welcome to CloudGuard AI</h2>
              <p className="text-xs text-slate-400">v2.4.1 · Enterprise Edition</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-3 p-3 rounded-xl"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${feature.color}18` }}
                >
                  <feature.icon size={16} style={{ color: feature.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{feature.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={dismiss}
              className="flex-1 btn-gradient text-white py-2.5 rounded-xl text-sm font-semibold"
            >
              Get Started →
            </button>
            <button
              onClick={() => { navigate('/settings'); dismiss(); }}
              className="px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:text-[#6366f1] transition-colors"
              style={{ border: '1px solid #e2e8f0' }}
            >
              Configure API Key
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
