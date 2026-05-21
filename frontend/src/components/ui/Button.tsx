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
    'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold h-[44px] px-6 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden';

  const variants = {
    primary:
      'bg-gradient-to-r from-accent-primary to-indigo-500 text-white border-none shadow-[0_4px_16px_rgba(99,102,241,0.4)] hover:shadow-[0_8px_25px_rgba(99,102,241,0.6)] hover:translate-y-[-1px] active:translate-y-0',
    outlined:
      'bg-transparent text-text-secondary border border-accent-primary/30 hover:border-accent-primary/70 hover:text-white hover:bg-accent-primary/5',
    ghost:
      'bg-transparent text-text-muted border-none hover:text-text-primary hover:bg-white/6',
    danger:
      'bg-transparent text-text-muted border border-accent-danger/25 hover:border-accent-danger hover:text-accent-danger hover:bg-accent-danger/5',
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
