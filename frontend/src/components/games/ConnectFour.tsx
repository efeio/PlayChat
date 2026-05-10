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
  const { board, currentPlayerIndex, winner } = gameState;
  const isMyTurn = gameState.players[currentPlayerIndex] === currentUserId;
  const isDraw = !winner && board[0].every((c) => c !== 0);
  const isFinished = !!winner || isDraw;

  const getPlayerName = (id: string) =>
    players.find((p) => p.userId === id)?.displayName || id;

  const currentTurnPlayer = gameState.players[currentPlayerIndex];

  const handleColumnClick = (col: number) => {
    if (isFinished || !isMyTurn || board[0][col] !== 0) return;
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
              <span className="text-white font-medium">Your turn — drop a piece</span>
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
                : 'text-text-secondary border border-transparent'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full ${
                i === 0
                  ? 'bg-white'
                  : 'bg-text-secondary'
              }`}
            />
            <span>{getPlayerName(pid)}</span>
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="bg-bg-elevated rounded-2xl p-2 sm:p-3 max-w-full overflow-x-auto border border-border-subtle">
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
            className="grid gap-1 sm:gap-1.5"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          >
            {Array.from({ length: COLS }).map((_, col) => {
              const cell = board[row][col];
              return (
                <button
                  key={`${row}-${col}`}
                  onClick={() => handleColumnClick(col)}
                  disabled={isFinished || !isMyTurn || board[0][col] !== 0}
                  className="w-11 h-11 sm:w-14 sm:h-14 bg-bg-base border border-border-subtle rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer disabled:cursor-default hover:bg-bg-card"
                >
                  {cell !== 0 && (
                    <div
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full transition-transform duration-200 ${
                        cell === 1
                          ? 'bg-white'
                          : 'bg-text-secondary'
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
