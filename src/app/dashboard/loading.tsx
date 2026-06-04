import React from 'react';
import Skeleton from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse select-none">
      {/* Title block skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48 bg-slate-200/60" />
        <Skeleton className="h-4 w-72 bg-slate-200/50" />
      </div>

      {/* Stats Cards Row (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-24 bg-slate-200/70" />
              <Skeleton className="h-7 w-7 rounded-lg bg-slate-200/80" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 bg-slate-200/80" />
              <Skeleton className="h-3.5 w-40 bg-slate-200/50" />
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Table Section (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2">
              <Skeleton className="h-4.5 w-36 bg-slate-200/70" />
              <Skeleton className="h-7 w-20 rounded-lg bg-slate-200/60" />
            </div>
            <div className="space-y-3.5 pt-2">
              <div className="flex border-b border-slate-50 pb-3 gap-4">
                <Skeleton className="h-3 w-1/4 bg-slate-200/60" />
                <Skeleton className="h-3 w-1/4 bg-slate-200/60" />
                <Skeleton className="h-3 w-1/4 bg-slate-200/60" />
                <Skeleton className="h-3 w-1/4 bg-slate-200/60" />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 py-2 border-b border-slate-50 last:border-0 items-center">
                  <Skeleton className="h-4 w-1/4 bg-slate-200/70" />
                  <Skeleton className="h-3 w-1/4 bg-slate-200/50" />
                  <Skeleton className="h-4 w-1/4 bg-slate-200/70" />
                  <Skeleton className="h-5 w-16 rounded-full bg-slate-200/80" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel Section (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <Skeleton className="h-4.5 w-28 bg-slate-200/70" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl bg-slate-200/60" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
