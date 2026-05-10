import { useEffect } from 'react';

export type ToastType = 'error' | 'success' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onDismiss: (id: string) => void;
}

export function Toast({ id, type, message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return 'border-red-500/30 bg-red-500/10 text-red-400';
      case 'success':
        return 'border-accent-green/30 bg-accent-green/10 text-accent-green';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
      default:
        return 'border-border bg-bg-surface text-text-primary';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'success':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        );
      case 'warning':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
    }
  };

  return (
    <div
      onClick={() => onDismiss(id)}
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${getTypeStyles()} animate-slide-in cursor-pointer min-w-[320px] max-w-md`}
    >
      <div className="shrink-0 mt-0.5">{getIcon()}</div>
      <p className="text-sm flex-1 leading-snug">{message}</p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(id);
        }}
        className="shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
