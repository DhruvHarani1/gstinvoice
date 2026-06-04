import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex-grow flex flex-col justify-center items-center py-16 px-4 text-center space-y-4 max-w-sm mx-auto select-none">
      <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
        <Icon className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
        <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
      </div>
      {action && (
        <div>
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center px-4 py-2 bg-[#6C63FF] hover:bg-[#554ce6] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center justify-center px-4 py-2 bg-[#6C63FF] hover:bg-[#554ce6] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
