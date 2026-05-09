# ToastContext Integration Guide

This guide shows how to integrate the ToastProvider into the PlayChat application.

## Step 1: Add ToastProvider to App.tsx

Update `frontend/src/App.tsx` to wrap the application with ToastProvider:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext'; // ADD THIS
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Room } from './pages/Room';
import type { ReactNode } from 'react';

// ... ProtectedRoute and PublicRoute components remain the same ...

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider> {/* ADD THIS */}
            <AppRoutes />
          </ToastProvider> {/* ADD THIS */}
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

## Step 2: Use Toast in Components

Now you can use the `useToast` hook in any component:

### Example: Room.tsx Socket Error Handling

```tsx
import { useToast } from '../context/ToastContext';

export function Room() {
  const { addToast } = useToast();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Show error toast when room:join fails
    socket.on('room:join', (response) => {
      if ('error' in response) {
        addToast('error', response.error);
      }
    });

    // Show error toast when game:start fails
    socket.on('game:start', (response) => {
      if ('error' in response) {
        addToast('error', response.error);
      }
    });

    // Show error toast when game:move fails
    socket.on('game:move', (response) => {
      if ('error' in response) {
        addToast('error', response.error);
      }
    });

    // Show warning toast when player disconnects
    socket.on('player:disconnected', (data) => {
      addToast('warning', `${data.username} disconnected`);
    });

    // Show success/warning toast when game ends
    socket.on('game:end', (data) => {
      if (data.reason === 'disconnect_timeout') {
        addToast('warning', 'Game ended: Opponent disconnected');
      } else if (data.winner) {
        addToast('success', `${data.winner} wins!`);
      } else {
        addToast('success', 'Game ended in a draw');
      }
    });

    return () => {
      socket.off('room:join');
      socket.off('game:start');
      socket.off('game:move');
      socket.off('player:disconnected');
      socket.off('game:end');
    };
  }, [socket, addToast]);

  return (
    <div>
      {/* Room content */}
    </div>
  );
}
```

### Example: Dashboard.tsx Error Handling

```tsx
import { useToast } from '../context/ToastContext';

export function Dashboard() {
  const { addToast } = useToast();

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      return await response.json();
    } catch (error) {
      addToast('error', 'Failed to load rooms. Please try again.');
    }
  };

  return (
    <div>
      {/* Dashboard content */}
    </div>
  );
}
```

## Step 3: Verify Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test toast notifications:
   - Try joining a room that doesn't exist → Should show error toast
   - Try starting a game when not room owner → Should show error toast
   - Complete a game → Should show success toast
   - Have a player disconnect during game → Should show warning toast

3. Verify toast behavior:
   - Toasts should appear in the top-right corner
   - Multiple toasts should stack vertically
   - Toasts should auto-dismiss after 4 seconds
   - Clicking a toast should dismiss it immediately

## Provider Order

The provider order is important for proper functionality:

```
BrowserRouter
  └─ AuthProvider (provides user authentication)
      └─ SocketProvider (requires auth token)
          └─ ToastProvider (can be used anywhere in the app)
              └─ AppRoutes (all routes have access to toast)
```

## Testing

After integration, run the tests to ensure everything works:

```bash
npm test -- src/context/ToastContext.test.tsx
```

All tests should pass.

## Troubleshooting

### Toast not appearing

- Verify ToastProvider is wrapping your component tree
- Check browser console for errors
- Ensure you're calling `addToast` correctly

### Toast appearing in wrong position

- Check for CSS conflicts with `fixed` positioning
- Verify `z-50` is high enough for your app's z-index stack

### Multiple toasts overlapping

- This should not happen if ToastProvider is implemented correctly
- Check that you're using the latest version of ToastContext.tsx

## Next Steps

After integration, you can:

1. Add toast notifications to all socket error handlers (Task 4.3)
2. Add toast notifications for game results (Task 4.4)
3. Customize toast duration if needed (pass `duration` prop to Toast component)
4. Add more toast types if needed (update ToastType enum)
