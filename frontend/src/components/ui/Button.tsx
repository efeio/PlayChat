import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outlined' | 'ghost' | 'danger';
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold h-[44px] px-6 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white border-none hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:scale-[1.02] transition-all',
    outlined:
      'bg-transparent text-text-secondary border border-accent-purple/40 hover:border-accent-purple/80 hover:text-white',
    ghost:
      'bg-transparent text-text-muted border-none hover:text-text-primary hover:bg-white/5',
    danger:
      'bg-transparent text-text-muted border border-red-400/25 hover:border-status-error hover:text-status-error',
  };

  const width = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${base} ${variants[variant]} ${width} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
