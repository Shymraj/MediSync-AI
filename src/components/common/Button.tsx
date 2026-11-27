import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none rounded-lg cursor-pointer';

  const variants = {
    primary: 'bg-[#2563A6] text-white hover:bg-[#1D4ED8] focus:ring-[#2563A6]',
    secondary: 'bg-[#E2E8F0] text-[#1E293B] hover:bg-[#CBD5E1] focus:ring-[#94A3B8]',
    outline: 'border border-[#CBD5E1] bg-white text-[#1E293B] hover:bg-[#F8FAFC] focus:ring-[#2563A6]',
    danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] focus:ring-[#DC2626]',
    success: 'bg-[#15803D] text-white hover:bg-[#166534] focus:ring-[#15803D]',
    ghost: 'bg-transparent text-[#1E293B] hover:bg-[#F1F5F9] focus:ring-[#CBD5E1]'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5'
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : icon}
      {children}
    </button>
  );
};
