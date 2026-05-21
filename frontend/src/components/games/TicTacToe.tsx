import { useState, useEffect } from 'react';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const { board, currentPlayerIndex, winner } = gameState;
  const isMyTurn = gameState.players[currentPlayerIndex] === currentUserId;
  const isDraw = !winner && board.every((c) => c !== null);
  const isFinished = !!winner || isDraw;

  const getPlayerName = (id: string) =>
    players.find((p) => p.userId === id)?.displayName || id;

  const currentTurnPlayer = gameState.players[currentPlayerIndex];

  useEffect(() => {
    setIsProcessing(false);
  }, [gameState]);

  const handleCellClick = (idx: number) => {
    if (isFinished || !isMyTurn || isProcessing || !!board[idx]) return;
    setIsProcessing(true);
    onMove({ position: idx });
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
              <span className="text-accent-secondary font-semibold">Sıra sende</span>
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
            <span className={`text-lg font-black ${i === 0 ? 'text-indigo-400' : 'text-cyan-400'}`}>
              {i === 0 ? 'X' : 'O'}
            </span>
            <span className={currentPlayerIndex === i && !isFinished ? 'text-white font-medium' : ''}>
              {getPlayerName(pid)}
            </span>
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="game-board p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {board.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              disabled={isFinished || !isMyTurn || isProcessing || !!cell}
              className={`game-cell w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center cursor-pointer disabled:cursor-default ${
                !cell && isMyTurn && !isFinished ? 'hover:bg-accent-primary/10 hover:border-accent-primary/30' : ''
              }`}
            >
              {cell && (
                <span className={`text-3xl sm:text-4xl font-black transition-all duration-200 ${
                  cell === 'X'
                    ? 'text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.7)]'
                    : 'text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]'
                }`}>
                  {cell}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
