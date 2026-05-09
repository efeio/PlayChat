/**
 * Toast Component Usage Example
 * 
 * This file demonstrates how to use the Toast component.
 * The Toast component follows the Architectural Noir design system:
 * - Background: #111111 (bg-bg-surface)
 * - White text
 * - Border: #222222 with colored accent based on type
 * - Flat surfaces, no gradients, no shadows
 * - Auto-dismiss after 4 seconds
 * - Manual dismiss on click
 */

import { useState } from 'react';
import { Toast, type ToastType } from './Toast';
import { Button } from './Button';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export function ToastExample() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="min-h-screen bg-bg-base p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Toast Component Demo</h1>
        
        <div className="space-y-3">
          <Button
            onClick={() => addToast('success', 'Game completed successfully!')}
            variant="primary"
          >
            Show Success Toast
          </Button>
          
          <Button
            onClick={() => addToast('error', 'Failed to join room. Please try again.')}
            variant="outlined"
          >
            Show Error Toast
          </Button>
          
          <Button
            onClick={() => addToast('warning', 'Player disconnected from the game.')}
            variant="outlined"
          >
            Show Warning Toast
          </Button>
        </div>

        {/* Toast Container - Fixed position at top-right */}
        <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              type={toast.type}
              message={toast.message}
              onDismiss={removeToast}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
