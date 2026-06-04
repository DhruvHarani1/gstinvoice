import React from 'react';
import { FileText, Send, Check, AlertTriangle, XCircle } from 'lucide-react';
import { InvoiceStatus } from '@/types';

interface StatusBadgeProps {
  status: InvoiceStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    draft: {
      bg: 'bg-slate-50 border-slate-200 text-slate-700',
      icon: <FileText className="w-3.5 h-3.5" />,
      label: 'Draft',
    },
    sent: {
      bg: 'bg-blue-50 border-blue-200 text-blue-700',
      icon: <Send className="w-3.5 h-3.5" />,
      label: 'Sent',
    },
    paid: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      icon: <Check className="w-3.5 h-3.5 stroke-[3px]" />,
      label: 'Paid',
    },
    overdue: {
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      label: 'Overdue',
    },
    cancelled: {
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: 'Cancelled',
    },
  };

  const currentStyle = styles[status] || styles.draft;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border leading-none shrink-0 select-none ${currentStyle.bg}`}>
      {currentStyle.icon}
      <span>{currentStyle.label}</span>
    </span>
  );
}
