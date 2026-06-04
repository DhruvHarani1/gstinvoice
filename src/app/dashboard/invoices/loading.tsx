import React from 'react';
import Skeleton from '@/components/ui/skeleton';

export default function InvoicesLoading() {
  return (
    <div className="space-y-6 animate-pulse select-none">
      {/* Header and CTA skeleton */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36 bg-slate-200/60" />
          <Skeleton className="h-3.5 w-64 bg-slate-200/50" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl bg-slate-200/80" />
      </div>

      {/* Main List Box */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
        {/* Search controls + tabs skeleton */}
        <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex border border-slate-100 rounded-lg p-0.5 bg-slate-50 gap-0.5 w-fit">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-16 rounded bg-slate-200/60" />
            ))}
          </div>
          <Skeleton className="h-9 w-full md:max-w-xs rounded-lg bg-slate-200/70" />
        </div>

        {/* Table skeleton */}
        <div className="space-y-4">
          <div className="flex bg-slate-50 p-3 rounded-lg border border-slate-100 gap-4">
            <Skeleton className="h-3 w-1/6 bg-slate-200/60" />
            <Skeleton className="h-3 w-1/4 bg-slate-200/60" />
            <Skeleton className="h-3 w-1/6 bg-slate-200/60" />
            <Skeleton className="h-3 w-1/6 bg-slate-200/60" />
            <Skeleton className="h-3 w-1/6 bg-slate-200/60" />
            <Skeleton className="h-3 w-20 bg-slate-200/60 ml-auto" />
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-4 px-3 py-4 border-b border-slate-50 last:border-0 items-center">
              <Skeleton className="h-4 w-1/6 bg-slate-200/70" />
              <Skeleton className="h-3 w-1/4 bg-slate-200/50" />
              <Skeleton className="h-3 w-1/6 bg-slate-200/50" />
              <Skeleton className="h-4 w-1/6 bg-slate-200/70" />
              <Skeleton className="h-5 w-16 rounded-full bg-slate-200/80" />
              <Skeleton className="h-4 w-20 rounded bg-slate-200/60 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
