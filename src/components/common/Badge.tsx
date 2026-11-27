import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'critical' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className
}) => {
  const styles = {
    primary: 'bg-blue-50 text-[#2563A6] border-blue-200',
    secondary: 'bg-slate-100 text-[#475569] border-slate-200',
    success: 'bg-green-50 text-[#15803D] border-green-200',
    warning: 'bg-amber-50 text-[#D97706] border-amber-200',
    critical: 'bg-red-50 text-[#DC2626] border-red-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  const dotColors = {
    primary: 'bg-[#2563A6]',
    secondary: 'bg-[#475569]',
    success: 'bg-[#15803D]',
    warning: 'bg-[#D97706]',
    critical: 'bg-[#DC2626]',
    neutral: 'bg-gray-400'
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1'
  };

  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-md border', styles[variant], sizes[size], className)}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
};
