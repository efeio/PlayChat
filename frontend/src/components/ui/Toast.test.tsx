import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from './Toast';

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders toast with correct message', () => {
    const onDismiss = vi.fn();
    render(
      <Toast
        id="test-toast"
        type="success"
        message="Test message"
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders error toast with correct styling', () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <Toast
        id="test-toast"
        type="error"
        message="Error message"
        onDismiss={onDismiss}
      />
    );

    const toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('border-status-error/20');
  });

  it('renders success toast with correct styling', () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <Toast
        id="test-toast"
        type="success"
        message="Success message"
        onDismiss={onDismiss}
      />
    );

    const toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('border-status-success/20');
  });

  it('renders warning toast with correct styling', () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <Toast
        id="test-toast"
        type="warning"
        message="Warning message"
        onDismiss={onDismiss}
      />
    );

    const toast = container.firstChild as HTMLElement;
    expect(toast).toHaveClass('border-accent-warm/20');
  });

  it('auto-dismisses after 4 seconds by default', () => {
    const onDismiss = vi.fn();
    render(
      <Toast
        id="test-toast"
        type="success"
        message="Test message"
        onDismiss={onDismiss}
      />
    );

    expect(onDismiss).not.toHaveBeenCalled();

    vi.advanceTimersByTime(4000);

    expect(onDismiss).toHaveBeenCalledWith('test-toast');
  });

  it('dismisses on click', () => {
    vi.useRealTimers(); // Use real timers for user interaction
    const onDismiss = vi.fn();
    
    render(
      <Toast
        id="test-toast"
        type="success"
        message="Test message"
        onDismiss={onDismiss}
      />
    );

    const toast = screen.getByRole('alert');
    toast.click();

    expect(onDismiss).toHaveBeenCalledWith('test-toast');
    
    vi.useFakeTimers(); // Restore fake timers for other tests
  });

  it('uses Architectural Noir styling', () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <Toast
        id="test-toast"
        type="error"
        message="Test message"
        onDismiss={onDismiss}
      />
    );

    const toast = container.firstChild as HTMLElement;
    // The background color should depend on type, for error it's bg-red-500/10
    // And for normal it should be bg-bg-surface
    expect(toast.className).toMatch(/bg-/);
    // Check for border
    expect(toast.className).toMatch(/border/);
  });

  it('has proper accessibility attributes', () => {
    const onDismiss = vi.fn();
    render(
      <Toast
        id="test-toast"
        type="error"
        message="Error message"
        onDismiss={onDismiss}
      />
    );

    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  it('cleans up timer on unmount', () => {
    const onDismiss = vi.fn();
    const { unmount } = render(
      <Toast
        id="test-toast"
        type="success"
        message="Test message"
        onDismiss={onDismiss}
      />
    );

    unmount();
    vi.advanceTimersByTime(4000);

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
