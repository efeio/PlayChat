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
              <span className="text-accent-yellow font-medium">Your turn</span>
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
            <span className={`text-base font-black ${i === 0 ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]'}`}>
              {i === 0 ? 'X' : 'O'}
            </span>
            <span className={currentPlayerIndex === i && !isFinished ? 'text-white' : ''}>{getPlayerName(pid)}</span>
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 p-4 bg-[#1B132B]/80 rounded-2xl backdrop-blur-xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleCellClick(idx)}
            disabled={isFinished || !isMyTurn || isProcessing || !!cell}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-[#120A1F]/50 rounded-xl flex items-center justify-center border border-white/5 hover:bg-white/5 transition-colors disabled:cursor-default disabled:hover:bg-[#120A1F]/50"
          >
            <span
              className={`text-4xl sm:text-5xl font-black ${
                cell === 'X'
                  ? 'text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]'
                  : cell === 'O'
                  ? 'text-purple-400 drop-shadow-[0_0_12px_rgba(192,132,252,0.8)]'
                  : ''
              }`}
            >
              {cell}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
