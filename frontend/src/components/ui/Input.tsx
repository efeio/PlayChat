import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-white">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white text-base placeholder-zinc-500 focus:outline-none focus:border-white/40 focus:bg-white/[0.15] transition-all duration-200 ${
            error ? 'border-red-500' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
