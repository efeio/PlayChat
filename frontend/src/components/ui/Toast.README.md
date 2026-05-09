# Toast Component

## Overview

The Toast component provides a notification system for displaying errors, success messages, and warnings to users. It follows the Architectural Noir design system with flat surfaces, no gradients, and no shadows.

## Features

- ✅ Three toast types: error, success, warning
- ✅ Auto-dismiss after 4 seconds (configurable)
- ✅ Manual dismiss on click
- ✅ Vertical stacking without overlap
- ✅ Architectural Noir styling (background #111111, white text, border #222222)
- ✅ Smooth slide-in animation
- ✅ Accessibility support (role="alert", aria-live="polite")

## Usage

### Basic Usage

```tsx
import { Toast } from './components/ui/Toast';

function MyComponent() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <>
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
    </>
  );
}
```

### With ToastContext (Recommended)

For global toast management, use the ToastContext (see task 4.2):

```tsx
import { useToast } from './context/ToastContext';

function MyComponent() {
  const { addToast } = useToast();

  const handleError = () => {
    addToast('error', 'Failed to join room. Please try again.');
  };

  const handleSuccess = () => {
    addToast('success', 'Game completed successfully!');
  };

  const handleWarning = () => {
    addToast('warning', 'Player disconnected from the game.');
  };

  return (
    <div>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleWarning}>Show Warning</button>
    </div>
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `id` | `string` | Yes | - | Unique identifier for the toast |
| `type` | `'error' \| 'success' \| 'warning'` | Yes | - | Toast type determining color and icon |
| `message` | `string` | Yes | - | Message to display |
| `onDismiss` | `(id: string) => void` | Yes | - | Callback when toast is dismissed |
| `duration` | `number` | No | `4000` | Auto-dismiss duration in milliseconds |

## Styling

The Toast component uses the following Architectural Noir design tokens:

- **Background**: `bg-bg-surface` (#111111)
- **Text**: `text-text-primary` (white)
- **Border**: `border` with type-specific colors:
  - Error: `border-red-500`
  - Success: `border-green-500`
  - Warning: `border-yellow-500`

## Accessibility

- Uses `role="alert"` for screen reader announcements
- Uses `aria-live="polite"` for non-intrusive notifications
- Keyboard accessible (clickable for dismissal)

## Requirements Satisfied

This component satisfies the following requirements from the PlayChat Completion spec:

- **3.1**: Display error notifications when socket events return errors
- **3.2**: Display success notifications when a game ends with a winner or draw
- **3.3**: Display warning notifications when a player disconnects during a game
- **3.4**: Auto-dismiss notifications after 4 seconds
- **3.5**: Allow manual dismissal by clicking the notification
- **3.6**: Stack multiple notifications vertically without overlap
- **3.7**: Follow the Architectural Noir design system (flat surfaces, no gradients, no shadows, border color #222222)
- **3.8**: Use white text on dark background (#111111) for readability

## Testing

Unit tests are available in `Toast.test.tsx`. To run tests:

```bash
# Note: Testing infrastructure needs to be set up first
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
npm test
```

## Example

See `Toast.example.tsx` for a complete working example with all three toast types.
