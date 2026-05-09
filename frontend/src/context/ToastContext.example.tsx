/**
 * ToastContext Usage Examples
 * 
 * This file demonstrates how to use the ToastContext for displaying
 * toast notifications throughout the application.
 */

import { useToast } from './ToastContext';

/**
 * Example 1: Basic Usage in a Component
 */
export function ExampleComponent() {
  const { addToast } = useToast();

  const handleSuccess = () => {
    addToast('success', 'Operation completed successfully!');
  };

  const handleError = () => {
    addToast('error', 'Something went wrong. Please try again.');
  };

  const handleWarning = () => {
    addToast('warning', 'This action cannot be undone.');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleWarning}>Show Warning</button>
    </div>
  );
}

/**
 * Example 2: Using Toast in Socket Event Handlers
 */
export function RoomComponent() {
  const { addToast } = useToast();
  // const { socket } = useSocket();

  // useEffect(() => {
  //   if (!socket) return;
  //
  //   socket.on('room:join', (response) => {
  //     if ('error' in response) {
  //       addToast('error', response.error);
  //     } else {
  //       addToast('success', 'Joined room successfully!');
  //     }
  //   });
  //
  //   socket.on('game:start', (response) => {
  //     if ('error' in response) {
  //       addToast('error', response.error);
  //     }
  //   });
  //
  //   socket.on('player:disconnected', (data) => {
  //     addToast('warning', `${data.username} disconnected`);
  //   });
  //
  //   return () => {
  //     socket.off('room:join');
  //     socket.off('game:start');
  //     socket.off('player:disconnected');
  //   };
  // }, [socket, addToast]);

  return <div>Room Component</div>;
}

/**
 * Example 3: Using Toast in Async Operations
 */
export function DataFetchComponent() {
  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      addToast('success', 'Data loaded successfully!');
      return data;
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to load data');
    }
  };

  return (
    <button onClick={fetchData}>
      Fetch Data
    </button>
  );
}

/**
 * Example 4: Multiple Toasts
 * 
 * The ToastContext automatically handles stacking multiple toasts
 * vertically without overlap.
 */
export function MultipleToastsExample() {
  const { addToast } = useToast();

  const showMultipleToasts = () => {
    addToast('success', 'First notification');
    setTimeout(() => addToast('warning', 'Second notification'), 500);
    setTimeout(() => addToast('error', 'Third notification'), 1000);
  };

  return (
    <button onClick={showMultipleToasts}>
      Show Multiple Toasts
    </button>
  );
}

/**
 * Example 5: Game Result Notifications
 */
export function GameResultExample() {
  const { addToast } = useToast();

  const handleGameEnd = (result: { winner: string | null; reason?: string }) => {
    if (result.reason === 'disconnect_timeout') {
      addToast('warning', 'Game ended: Opponent disconnected');
    } else if (result.winner) {
      addToast('success', `Game ended: ${result.winner} wins!`);
    } else {
      addToast('success', 'Game ended: Draw');
    }
  };

  return (
    <div>
      <button onClick={() => handleGameEnd({ winner: 'Player 1' })}>
        Simulate Win
      </button>
      <button onClick={() => handleGameEnd({ winner: null })}>
        Simulate Draw
      </button>
      <button onClick={() => handleGameEnd({ winner: null, reason: 'disconnect_timeout' })}>
        Simulate Disconnect
      </button>
    </div>
  );
}
