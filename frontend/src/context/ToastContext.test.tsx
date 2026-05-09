import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { ToastProvider, useToast } from './ToastContext';

// Test component that uses the toast context
function TestComponent() {
  const { addToast } = useToast();

  return (
    <div>
      <button onClick={() => addToast('success', 'Success message')}>
        Add Success Toast
      </button>
      <button onClick={() => addToast('error', 'Error message')}>
        Add Error Toast
      </button>
      <button onClick={() => addToast('warning', 'Warning message')}>
        Add Warning Toast
      </button>
    </div>
  );
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should throw error when useToast is used outside ToastProvider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');

    consoleError.mockRestore();
  });

  it('should render toast when addToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Add Success Toast');
    act(() => {
      button.click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should render multiple toasts without overlap', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Add Success Toast').click();
    });

    act(() => {
      screen.getByText('Add Error Toast').click();
    });

    act(() => {
      screen.getByText('Add Warning Toast').click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('should auto-dismiss toast after 4 seconds', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Add Success Toast').click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  it('should remove toast when clicked', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Add Success Toast').click();
    });

    const toast = screen.getByText('Success message');
    expect(toast).toBeInTheDocument();

    act(() => {
      const alertElement = toast.closest('[role="alert"]') as HTMLElement;
      alertElement.click();
    });

    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });

  it('should stack multiple toasts vertically', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Add Success Toast').click();
      screen.getByText('Add Error Toast').click();
    });

    const toastContainer = screen.getByText('Success message').closest('div')?.parentElement?.parentElement;
    expect(toastContainer).toHaveClass('flex-col');
    expect(toastContainer).toHaveClass('gap-2');
  });

  it('should generate unique IDs for each toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Add Success Toast').click();
      screen.getByText('Add Success Toast').click();
    });

    const toasts = screen.getAllByText('Success message');
    expect(toasts).toHaveLength(2);
  });

  it('should handle different toast types correctly', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Add Success Toast').click();
    });
    expect(screen.getByText('Success message')).toBeInTheDocument();

    act(() => {
      screen.getByText('Add Error Toast').click();
    });
    expect(screen.getByText('Error message')).toBeInTheDocument();

    act(() => {
      screen.getByText('Add Warning Toast').click();
    });
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });
});
