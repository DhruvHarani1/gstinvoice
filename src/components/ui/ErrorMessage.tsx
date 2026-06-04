import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  title?: string;
}

export function ErrorMessage({ 
  message = 'Something went wrong. Please try again.', 
  title = 'Error',
  className,
  ...props 
}: ErrorMessageProps) {
  return (
    <div
      className={cn(
        'bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800 shadow-sm max-w-xl mx-auto w-full select-text',
        className
      )}
      {...props}
    >
      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <h4 className="font-bold text-sm leading-none">{title}</h4>
        <p className="text-xs text-red-700 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

export default ErrorMessage;
