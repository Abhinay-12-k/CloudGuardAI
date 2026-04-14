export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse shadow-sm">
      <div className="h-3 bg-slate-100 rounded w-24 mb-3" />
      <div className="h-8 bg-slate-100 rounded w-16 mb-2" />
      <div className="h-2 bg-slate-100 rounded w-32" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      {[80, 60, 100, 50, 50, 70].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-slate-100 rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonNodeCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse space-y-3 shadow-sm">
      <div className="flex justify-between">
        <div className="h-4 bg-slate-100 rounded w-32" />
        <div className="h-4 bg-slate-100 rounded w-16" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="h-2 bg-slate-100 rounded w-full mb-1" />
          <div className="h-1 bg-slate-100 rounded w-full" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-slate-100 rounded w-48 mb-6" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-64 bg-white border border-slate-200 rounded-2xl animate-pulse shadow-sm" />
        <div className="h-64 bg-white border border-slate-200 rounded-2xl animate-pulse shadow-sm" />
      </div>
    </div>
  );
}
