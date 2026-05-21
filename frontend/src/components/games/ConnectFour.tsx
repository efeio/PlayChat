import { useState, useEffect } from 'react';

const ROWS = 6;
const COLS = 7;

interface ConnectFourProps {
  gameState: {
    board: number[][];
    currentPlayerIndex: number;
    players: string[];
    winner: string | null;
  };
  onMove: (move: { column: number }) => void;
  currentUserId: string;
  players: { userId: string; displayName: string }[];
}

export function ConnectFour({ gameState, onMove, currentUserId, players }: ConnectFourProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { board, currentPlayerIndex, winner } = gameState;
  const isMyTurn = gameState.players[currentPlayerIndex] === currentUserId;
  const isDraw = !winner && board[0].every((c) => c !== 0);
  const isFinished = !!winner || isDraw;

  const getPlayerName = (id: string) =>
    players.find((p) => p.userId === id)?.displayName || id;

  const currentTurnPlayer = gameState.players[currentPlayerIndex];

  useEffect(() => {
    setIsProcessing(false);
  }, [gameState]);

  const handleColumnClick = (col: number) => {
    if (isFinished || !isMyTurn || isProcessing || board[0][col] !== 0) return;
    setIsProcessing(true);
    onMove({ column: col });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status */}
      <div className="text-center">
        {isFinished ? (
          <p className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-family-display)' }}>
            {winner ? `${getPlayerName(winner)} kazandı!` : 'Berabere!'}
          </p>
        ) : (
          <p className="text-text-secondary text-sm">
            {isMyTurn ? (
              <span className="text-accent-secondary font-semibold">Sıra sende — taş bırak</span>
            ) : (
              `${getPlayerName(currentTurnPlayer)} bekleniyor...`
            )}
          </p>
        )}
      </div>

      {/* Players */}
      <div className="flex gap-4">
        {gameState.players.map((pid, i) => (
          <div
            key={pid}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
              currentPlayerIndex === i && !isFinished
                ? 'bg-bg-card border border-accent-primary/20 shadow-lg shadow-accent-primary/5'
                : 'text-text-secondary border border-transparent'
            }`}
          >
            <div className={`w-4 h-4 rounded-full ${
              i === 0 ? 'game-piece-1' : 'game-piece-2'
            }`} />
            <span className={currentPlayerIndex === i && !isFinished ? 'text-white font-medium' : ''}>
              {getPlayerName(pid)}
            </span>
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="game-board p-3 sm:p-4 max-w-full overflow-x-auto">
        {/* Column headers */}
        <div className="grid gap-1.5 sm:gap-2 mb-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {Array.from({ length: COLS }).map((_, col) => (
            <button
              key={`hdr-${col}`}
              onClick={() => handleColumnClick(col)}
              disabled={isFinished || !isMyTurn || board[0][col] !== 0}
              className="h-7 flex items-center justify-center text-text-muted hover:text-accent-secondary transition-all duration-200 cursor-pointer disabled:cursor-default disabled:opacity-30"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </button>
          ))}
        </div>

        {/* Grid cells */}
        {Array.from({ length: ROWS }).map((_, row) => (
          <div
            key={row}
            className="grid gap-1.5 sm:gap-2 mt-1.5 sm:mt-2"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          >
            {Array.from({ length: COLS }).map((_, col) => {
              const cell = board[row][col];
              return (
                <button
                  key={`${row}-${col}`}
                  onClick={() => handleColumnClick(col)}
                  disabled={isFinished || !isMyTurn || board[0][col] !== 0}
                  className="game-cell w-10 h-10 sm:w-12 sm:h-12 !rounded-full flex items-center justify-center disabled:cursor-default"
                >
                  {cell !== 0 && (
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 scale-100 ${
                      cell === 1 ? 'game-piece-1' : 'game-piece-2'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
