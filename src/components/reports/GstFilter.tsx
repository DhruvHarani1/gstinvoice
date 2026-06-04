'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface GstFilterProps {
  from: string;
  to: string;
}

export default function GstFilter({ from, to }: GstFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set('from', fromDate);
    params.set('to', toDate);
    router.push(`/dashboard/reports?${params.toString()}`);
    toast.success('GST date filters applied.');
  };

  const handleExportCSV = () => {
    window.location.href = `/api/reports/export?type=gst_summary&from=${fromDate}&to=${toDate}`;
    toast.success('Downloading GST summary CSV.');
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
      <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer border-none p-0 focus:ring-0"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer border-none p-0 focus:ring-0"
          />
        </div>

        <button
          type="submit"
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          Apply Filter
        </button>
      </form>

      <button
        onClick={handleExportCSV}
        className="bg-[#6C63FF] hover:bg-[#5b52eb] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-50 shrink-0 self-end sm:self-auto"
      >
        <Download className="w-3.5 h-3.5" />
        Export GST Summary CSV
      </button>
    </div>
  );
}
