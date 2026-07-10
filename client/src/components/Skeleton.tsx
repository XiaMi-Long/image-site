import type { CSSProperties } from 'react';
import { cn } from '../lib/utils';

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn('animate-pulse rounded bg-border', className)} style={style} />;
}

export function CardSkeleton() {
  return <Skeleton className="aspect-[3/2] w-full" />;
}

export function LineSkeleton({ width = '100%' }: { width?: string }) {
  return <Skeleton className="h-3 w-full" style={{ width }} />;
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-2 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
