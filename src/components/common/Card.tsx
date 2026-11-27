import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  className,
  noPadding = false
}) => {
  return (
    <div className={clsx('bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] bg-white">
          <div>
            {title && <h3 className="text-sm font-semibold text-[#1E293B]">{title}</h3>}
            {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={clsx(!noPadding && 'p-5')}>{children}</div>
    </div>
  );
};
