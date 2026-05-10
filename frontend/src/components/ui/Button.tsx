import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outlined';
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
    'inline-flex items-center justify-center gap-2 rounded-full text-base font-semibold transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-white text-black hover:bg-neutral-200 active:scale-[0.98] shadow-sm',
    outlined:
      'bg-transparent text-text-secondary hover:text-white hover:bg-bg-card border border-border-default hover:border-border-strong',
  };

  const width = fullWidth ? 'w-full' : '';

  return (
    <button
      style={{ paddingTop: '14px', paddingBottom: '14px', paddingLeft: '32px', paddingRight: '32px' }}
      className={`${base} ${variants[variant]} ${width} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
