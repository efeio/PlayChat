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
          <label htmlFor={id} className="text-[13px] font-medium text-text-secondary mb-[6px]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full bg-[#120A1F]/50 border border-white/5 rounded-xl text-white text-sm placeholder-text-muted px-4 py-3 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all duration-200 backdrop-blur-md shadow-inner ${
            error ? 'border-status-error focus:border-status-error focus:ring-status-error/50' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-status-error mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
