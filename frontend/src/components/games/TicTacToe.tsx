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
          <p className="text-white font-semibold text-lg">
            {winner
              ? `${getPlayerName(winner)} wins!`
              : 'Draw!'}
          </p>
        ) : (
          <p className="text-text-secondary text-sm">
            {isMyTurn ? (
              <span className="text-white font-medium">Your turn</span>
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
                ? 'bg-bg-card text-white border border-border-subtle'
                : 'text-text-secondary'
            }`}
          >
            <span className="font-semibold text-base">
              {i === 0 ? 'X' : 'O'}
            </span>
            <span>{getPlayerName(pid)}</span>
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleCellClick(idx)}
            disabled={isFinished || !isMyTurn || isProcessing || !!cell}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-bg-elevated border border-border-subtle rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold transition-all duration-200 hover:bg-bg-card hover:border-border-default disabled:cursor-default cursor-pointer"
          >
            <span
              className={
                cell === 'X'
                  ? 'text-white'
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
