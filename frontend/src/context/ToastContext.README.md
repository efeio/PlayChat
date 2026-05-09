# ToastContext

Global toast notification system for PlayChat application.

## Overview

The ToastContext provides a centralized way to display toast notifications throughout the application. It manages a queue of toasts with automatic stacking, auto-dismissal, and manual dismissal capabilities.

## Features

- **Three Toast Types**: `error`, `success`, `warning`
- **Auto-Dismiss**: Toasts automatically disappear after 4 seconds
- **Manual Dismiss**: Click any toast to dismiss it immediately
- **Vertical Stacking**: Multiple toasts stack vertically without overlap
- **Architectural Noir Styling**: Follows the design system (flat surfaces, no gradients, no shadows)
- **Accessibility**: Proper ARIA attributes for screen readers

## Installation

The ToastContext is already set up in the application. To use it in a component:

```tsx
import { useToast } from '../context/ToastContext';

function MyComponent() {
  const { addToast } = useToast();
  
  // Use addToast to show notifications
  addToast('success', 'Operation completed!');
}
```

## API

### `useToast()`

Hook that provides access to the toast system.

**Returns:**
- `addToast(type: ToastType, message: string): void` - Add a new toast notification
- `removeToast(id: string): void` - Manually remove a toast (usually not needed)

### Toast Types

- `'error'` - Red border, ✕ icon - for errors and failures
- `'success'` - Green border, ✓ icon - for successful operations
- `'warning'` - Yellow border, ⚠ icon - for warnings and important notices

## Usage Examples

### Basic Usage

```tsx
import { useToast } from '../context/ToastContext';

function MyComponent() {
  const { addToast } = useToast();

  const handleClick = () => {
    addToast('success', 'Action completed successfully!');
  };

  return <button onClick={handleClick}>Do Something</button>;
}
```

### Socket Error Handling

```tsx
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';

function RoomComponent() {
  const { addToast } = useToast();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('room:join', (response) => {
      if ('error' in response) {
        addToast('error', response.error);
      }
    });

    socket.on('game:move', (response) => {
      if ('error' in response) {
        addToast('error', response.error);
      }
    });

    return () => {
      socket.off('room:join');
      socket.off('game:move');
    };
  }, [socket, addToast]);

  return <div>Room Content</div>;
}
```

### Game Result Notifications

```tsx
import { useToast } from '../context/ToastContext';

function GameComponent() {
  const { addToast } = useToast();

  useEffect(() => {
    socket.on('game:end', (data) => {
      if (data.reason === 'disconnect_timeout') {
        addToast('warning', 'Game ended: Opponent disconnected');
      } else if (data.winner) {
        addToast('success', `${data.winner} wins!`);
      } else {
        addToast('success', 'Game ended in a draw');
      }
    });
  }, [socket, addToast]);

  return <div>Game Board</div>;
}
```

### Multiple Toasts

The system automatically handles multiple toasts by stacking them vertically:

```tsx
const { addToast } = useToast();

// These will stack vertically
addToast('success', 'First notification');
addToast('warning', 'Second notification');
addToast('error', 'Third notification');
```

## Design System Compliance

The ToastContext follows the Architectural Noir design system:

- **Background**: `#111111` (bg-surface)
- **Text**: White (`#ffffff`)
- **Borders**: Type-specific colors (red/green/yellow)
- **No gradients**: Flat surfaces only
- **No shadows**: Clean, minimal design
- **Border color**: `#222222` for container

## Accessibility

- Each toast has `role="alert"` for screen reader announcements
- Container has `aria-live="polite"` for non-intrusive updates
- Toasts are keyboard accessible (can be dismissed with click)

## Testing

The ToastContext includes comprehensive unit tests covering:

- Toast rendering and display
- Multiple toast stacking
- Auto-dismissal after 4 seconds
- Manual dismissal on click
- Error handling when used outside provider
- Unique ID generation

Run tests with:

```bash
npm test -- src/context/ToastContext.test.tsx
```

## Integration with App

The ToastProvider should wrap your entire application in `main.tsx`:

```tsx
import { ToastProvider } from './context/ToastContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);
```

## Requirements Satisfied

This implementation satisfies **Requirement 3.6** from the PlayChat Completion spec:

- ✅ Global toast management context
- ✅ `addToast` function for adding notifications
- ✅ `removeToast` function for dismissing notifications
- ✅ Toast queue with vertical stacking
- ✅ Multiple toasts don't overlap
- ✅ Architectural Noir design system compliance

## Related Components

- `Toast.tsx` - Individual toast component
- `Toast.test.tsx` - Toast component tests
- `Toast.example.tsx` - Toast component usage examples
- `Toast.README.md` - Toast component documentation
