export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="h-4 w-72 rounded bg-gray-100" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-8 w-56 rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-100" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-gray-100" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="h-10 w-28 rounded bg-gray-200" />
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <div className="h-12 bg-gray-50" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 border-t border-gray-100" />
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-5 w-36 rounded bg-gray-200" />
          <div className="h-3 w-24 rounded bg-gray-100" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex h-screen animate-pulse flex-col">
      <div className="h-16 border-b border-gray-200 bg-gray-50" />
      <div className="flex-1 space-y-4 p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <div className={`h-12 rounded-2xl ${i % 2 === 0 ? 'w-48 bg-blue-100' : 'w-64 bg-gray-100'}`} />
          </div>
        ))}
      </div>
      <div className="h-20 border-t border-gray-200 bg-gray-50" />
    </div>
  );
}
