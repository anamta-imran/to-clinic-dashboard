export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1360px] animate-pulse space-y-4">
      <div className="panel h-16" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="panel h-28" />
        ))}
      </div>
      <div className="panel h-72" />
      <div className="panel h-64" />
    </div>
  );
}
