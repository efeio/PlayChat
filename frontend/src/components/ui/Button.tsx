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
    'inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-bold h-[46px] px-6 transition-all duration-250 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden';

  const variants = {
    primary:
      'bg-gradient-to-r from-accent-primary via-accent-primary/90 to-accent-primary text-text-inverse border-none shadow-[0_4px_20px_var(--glow-primary)] hover:shadow-[0_8px_30px_var(--glow-primary)] hover:translate-y-[-2px] active:translate-y-0 active:scale-[0.98]',
    outlined:
      'bg-transparent text-text-secondary border border-accent-primary/25 hover:border-accent-primary/60 hover:text-text-primary hover:bg-accent-primary/5 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]',
    ghost:
      'bg-transparent text-text-muted border-none hover:text-text-primary hover:bg-accent-primary/5',
    danger:
      'bg-transparent text-text-muted border border-accent-danger/20 hover:border-accent-danger hover:text-accent-danger hover:bg-accent-danger/5 hover:shadow-[0_0_20px_rgba(255,92,124,0.1)]',
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
