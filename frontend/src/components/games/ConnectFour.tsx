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
          <p className="text-white font-semibold text-lg">
            {winner ? `${getPlayerName(winner)} wins!` : 'Draw!'}
          </p>
        ) : (
          <p className="text-text-secondary text-sm">
            {isMyTurn ? (
              <span className="text-accent-yellow font-medium">Your turn — drop a piece</span>
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all duration-200 ${
              currentPlayerIndex === i && !isFinished
                ? 'bg-[#1B132B]/80 border border-white/10 backdrop-blur-md shadow-md'
                : 'text-text-secondary border border-transparent'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full shadow-sm ${
                i === 0
                  ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                  : 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
              }`}
            />
            <span className={currentPlayerIndex === i && !isFinished ? 'text-white' : ''}>{getPlayerName(pid)}</span>
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="bg-[#1B132B]/80 rounded-2xl backdrop-blur-xl p-3 sm:p-4 max-w-full overflow-x-auto border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Column headers (clickable) */}
        <div className="grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {Array.from({ length: COLS }).map((_, col) => (
            <button
              key={`hdr-${col}`}
              onClick={() => handleColumnClick(col)}
              disabled={isFinished || !isMyTurn || board[0][col] !== 0}
              className="h-6 sm:h-8 flex items-center justify-center text-text-faint hover:text-white transition-all duration-200 cursor-pointer disabled:cursor-default"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="sm:w-4 sm:h-4">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </button>
          ))}
        </div>

        {/* Grid cells */}
        {Array.from({ length: ROWS }).map((_, row) => (
          <div
            key={row}
            className="grid gap-1 sm:gap-1.5 mt-1 sm:mt-1.5"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          >
            {Array.from({ length: COLS }).map((_, col) => {
              const cell = board[row][col];
              return (
                <button
                  key={`${row}-${col}`}
                  onClick={() => handleColumnClick(col)}
                  disabled={isFinished || !isMyTurn || board[0][col] !== 0}
                  className="w-11 h-11 sm:w-14 sm:h-14 bg-[#120A1F]/50 rounded-full flex items-center justify-center border border-white/5 shadow-inner disabled:cursor-default hover:bg-white/5 transition-colors"
                >
                  {cell !== 0 && (
                    <div
                      className={`w-8 h-8 sm:w-11 sm:h-11 rounded-full transition-all duration-300 ${
                        cell === 1
                          ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] scale-100'
                          : 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)] scale-100'
                      }`}
                    />
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
