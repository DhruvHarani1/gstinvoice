import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  type?: 'danger' | 'info' | 'warning';
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  type = 'danger',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const iconColors = {
    danger: 'bg-red-50 text-red-650 border border-red-100',
    warning: 'bg-amber-50 text-amber-650 border border-amber-100',
    info: 'bg-indigo-50 text-indigo-650 border border-indigo-100',
  };

  const confirmColors = {
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-red-100',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-100',
    info: 'bg-[#6C63FF] hover:bg-[#554ce6] text-white shadow-indigo-100',
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in select-none">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-100">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full shrink-0 ${iconColors[type]}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{description}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 font-bold rounded-lg text-xs transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50 ${confirmColors[type]}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
