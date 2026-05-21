import { useState, useEffect } from 'react';

interface CardState {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryCardsProps {
  gameState: {
    players: string[];
    cards: CardState[];
    currentPlayerIndex: number;
    flippedCards: number[];
    scores: Record<string, number>;
    winner: string | null;
    finished: boolean;
    pairCount: number;
    matchedPairs: number;
    lastAction: 'flip' | 'match' | 'mismatch' | null;
  };
  onMove: (move: { cardId: number }) => void;
  currentUserId: string;
  players: { userId: string; displayName: string }[];
}

export function MemoryCards({ gameState, onMove, currentUserId, players }: MemoryCardsProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const { cards, currentPlayerIndex, scores, winner, finished, pairCount, matchedPairs } = gameState;
  const isMyTurn = gameState.players[currentPlayerIndex] === currentUserId;

  const getPlayerName = (id: string) =>
    players.find((p) => p.userId === id)?.displayName || id;

  useEffect(() => {
    setIsProcessing(false);
  }, [gameState]);

  const handleCardClick = (cardId: number) => {
    if (!isMyTurn || isProcessing || finished) return;
    const card = cards[cardId];
    if (card.isMatched || card.isFlipped) return;
    if (gameState.flippedCards.length >= 2) return;

    setIsProcessing(true);
    onMove({ cardId });
  };

  const gridCols = cards.length <= 16 ? 'grid-cols-4' : 'grid-cols-6';

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-lg">
      {/* Status */}
      <div className="text-center">
        {finished ? (
          <p className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-family-display)' }}>
            {winner ? `${getPlayerName(winner)} kazandı!` : 'Berabere!'}
          </p>
        ) : (
          <p className="text-text-secondary text-sm">
            {isMyTurn ? (
              <span className="text-accent-secondary font-semibold">Sıra sende — bir kart çevir</span>
            ) : (
              `${getPlayerName(gameState.players[currentPlayerIndex])} bekleniyor...`
            )}
          </p>
        )}
        <p className="text-text-muted text-xs mt-1">
          {matchedPairs} / {pairCount} eşleşme bulundu
        </p>
      </div>

      {/* Scores */}
      <div className="flex gap-3 flex-wrap justify-center">
        {gameState.players.map((playerId) => {
          const isActive = gameState.players[currentPlayerIndex] === playerId && !finished;
          return (
            <div
              key={playerId}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-accent-primary/15 border border-accent-primary/40 text-accent-secondary'
                  : 'bg-bg-elevated border border-border-subtle text-text-secondary'
              }`}
            >
              {getPlayerName(playerId)}: {scores[playerId] || 0}
            </div>
          );
        })}
      </div>

      {/* Card Grid */}
      <div className={`grid ${gridCols} gap-2 w-full`}>
        {cards.map((card) => {
          const isRevealed = card.isFlipped || card.isMatched;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={!isMyTurn || isProcessing || finished || card.isMatched || card.isFlipped}
              className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all duration-300 cursor-pointer disabled:cursor-default ${
                card.isMatched
                  ? 'bg-emerald-600/20 border border-emerald-500/40 scale-95'
                  : isRevealed
                    ? 'bg-bg-elevated border border-accent-primary/40 scale-105'
                    : 'bg-bg-card border border-border-default hover:border-accent-primary/30 hover:bg-bg-elevated'
              }`}
            >
              {isRevealed ? (
                <span className="select-none">{card.symbol}</span>
              ) : (
                <span className="text-text-muted text-lg select-none">?</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
