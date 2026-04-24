// components/skeletons/barbershop-skeleton.tsx
export default function BarbershopSkeleton() {
  return (
    <div className="w-40 shrink-0 space-y-2">
      <div className="h-25 w-full animate-pulse rounded-xl bg-muted" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
    </div>
  );
}
