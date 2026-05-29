import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={id} className="text-[13px] font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full bg-bg-base/70 border border-border-default rounded-xl text-text-primary text-sm placeholder-text-muted px-4 py-3 focus:outline-none focus:border-accent-primary/40 focus:ring-2 focus:ring-accent-primary/10 focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all duration-250 ${
            error ? 'border-status-error focus:border-status-error focus:ring-status-error/10' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-status-error mt-1.5">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
