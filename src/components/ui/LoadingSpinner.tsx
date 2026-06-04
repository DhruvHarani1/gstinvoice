import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ size = 'md', className, ...props }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-t-[#6C63FF] border-slate-200',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}

export default LoadingSpinner;
