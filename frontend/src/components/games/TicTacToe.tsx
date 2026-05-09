interface TicTacToeProps {
  gameState: {
    board: (string | null)[];
    currentPlayerIndex: number;
    players: string[];
    winner: string | null;
  };
  onMove: (move: { position: number }) => void;
  currentUserId: string;
  players: { userId: string; displayName: string }[];
}

export function TicTacToe({ gameState, onMove, currentUserId, players }: TicTacToeProps) {
  const { board, currentPlayerIndex, winner } = gameState;
  const isMyTurn = gameState.players[currentPlayerIndex] === currentUserId;
  const isDraw = !winner && board.every((c) => c !== null);
  const isFinished = !!winner || isDraw;

  const getPlayerName = (id: string) =>
    players.find((p) => p.userId === id)?.displayName || id;

  const currentTurnPlayer = gameState.players[currentPlayerIndex];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status */}
      <div className="text-center">
        {isFinished ? (
          <p className="text-text-primary font-semibold text-lg">
            {winner
              ? `${getPlayerName(winner)} wins!`
              : 'Draw!'}
          </p>
        ) : (
          <p className="text-text-secondary text-sm">
            {isMyTurn ? (
              <span className="text-text-primary font-medium">Your turn</span>
            ) : (
              `Waiting for ${getPlayerName(currentTurnPlayer)}...`
            )}
          </p>
        )}
      </div>

      {/* Players */}
      <div className="flex gap-6">
        {gameState.players.map((pid, i) => (
          <div
            key={pid}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              currentPlayerIndex === i && !isFinished
                ? 'bg-bg-elevated text-text-primary'
                : 'text-text-secondary'
            }`}
            style={currentPlayerIndex === i && !isFinished ? { borderWidth: '1px', borderColor: '#222222' } : undefined}
          >
            <span className="font-semibold text-base">
              {i === 0 ? 'X' : 'O'}
            </span>
            <span>{getPlayerName(pid)}</span>
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => onMove({ position: idx })}
            disabled={isFinished || !isMyTurn || !!cell}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-bg-elevated rounded-lg flex items-center justify-center text-2xl sm:text-3xl font-bold transition-colors hover:bg-bg-surface disabled:cursor-default cursor-pointer"
            style={{ borderWidth: '1px', borderColor: '#222222' }}
          >
            <span
              className={
                cell === 'X'
                  ? 'text-text-primary'
                  : cell === 'O'
                  ? 'text-text-secondary'
                  : ''
              }
            >
              {cell}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
