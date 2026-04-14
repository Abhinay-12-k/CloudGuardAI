import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 empty-state-border rounded-2xl bg-white">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-300" />
      </div>
      <p className="font-medium text-slate-500">{title}</p>
      {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
