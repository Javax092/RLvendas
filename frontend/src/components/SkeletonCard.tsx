export function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
      <div className="h-44 bg-white/10" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 rounded bg-white/10" />
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-1/2 rounded bg-white/10" />
      </div>
    </div>
  );
}

