'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar } from 'lucide-react';

interface MonthFilterProps {
  currentMonth: string;
}

export default function MonthFilter({ currentMonth }: MonthFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', e.target.value);
    router.push(`/dashboard/reports?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm shrink-0">
      <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
      <span className="text-xs font-bold text-slate-500">Period:</span>
      <input
        type="month"
        value={currentMonth}
        onChange={handleMonthChange}
        className="text-xs font-bold text-slate-700 outline-none cursor-pointer bg-transparent border-none p-0 focus:ring-0"
      />
    </div>
  );
}
