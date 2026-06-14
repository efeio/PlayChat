import { useState, useEffect, useRef, useCallback } from 'react';

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

const LOCK_SAFETY_TIMEOUT_MS = 3000;

export function MemoryCards({ gameState, onMove, currentUserId, players }: MemoryCardsProps) {
  const [localLock, setLocalLock] = useState(false);
  const [mismatchClosed, setMismatchClosed] = useState(false);
  const [pendingCards, setPendingCards] = useState<Set<number>>(new Set());
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSafetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { cards, currentPlayerIndex, scores, winner, finished, pairCount, matchedPairs, lastAction } = gameState;
  const isMyTurn = gameState.players[currentPlayerIndex] === currentUserId;
  const isLocked = localLock;

  const mismatchedCardIds = useRef(new Set<number>());
  if (lastAction === 'mismatch') {
    mismatchedCardIds.current = new Set(gameState.flippedCards);
  } else {
    mismatchedCardIds.current = new Set<number>();
  }

  const getPlayerName = (id: string) =>
    players.find((p) => p.userId === id)?.displayName || id;

  useEffect(() => {
    setPendingCards(new Set());
    if (pendingSafetyRef.current) {
      clearTimeout(pendingSafetyRef.current);
      pendingSafetyRef.current = null;
    }

    if (lastAction === 'mismatch') {
      setLocalLock(true);
      setMismatchClosed(false);
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      lockTimerRef.current = setTimeout(() => {
        setLocalLock(false);
        setMismatchClosed(true);
      }, 1300);
    } else {
      setLocalLock(false);
      setMismatchClosed(false);
    }
  }, [gameState, lastAction]);

  useEffect(() => {
    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      if (pendingSafetyRef.current) clearTimeout(pendingSafetyRef.current);
    };
  }, []);

  const handleCardClick = useCallback((cardId: number) => {
    if (!isMyTurn || isLocked || finished) return;
    const card = cards[cardId];
    if (!card || card.isMatched) return;
    if (card.isFlipped && !mismatchedCardIds.current.has(cardId)) return;
    if (pendingCards.has(cardId)) return;
    const activeFlipped = lastAction === 'mismatch' ? 0 : gameState.flippedCards.length;
    const totalFlipped = activeFlipped + pendingCards.size;
    if (totalFlipped >= 2) return;
    setPendingCards(prev => new Set(prev).add(cardId));
    if (pendingSafetyRef.current) clearTimeout(pendingSafetyRef.current);
    pendingSafetyRef.current = setTimeout(() => {
      setPendingCards(new Set());
    }, LOCK_SAFETY_TIMEOUT_MS);
    onMove({ cardId });
  }, [isMyTurn, isLocked, finished, cards, pendingCards, gameState.flippedCards, lastAction, onMove]);

  const gridCols = cards.length <= 16 ? 'grid-cols-4' : 'grid-cols-6';
  const gridWidth = cards.length <= 16 ? 'w-[320px] sm:w-[380px]' : 'w-[380px] sm:w-[460px]';

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl">
      {/* Status */}
      <div className="text-center">
        {finished ? (
          <div className="space-y-1">
            <p className="text-text-primary font-bold text-lg" style={{ fontFamily: 'var(--font-family-display)' }}>
              {winner ? `${getPlayerName(winner)} kazandı!` : 'Berabere!'}
            </p>
            <p className="text-text-muted text-xs">Tüm eşler bulundu</p>
          </div>
        ) : (
          <p className="text-text-secondary text-sm">
            {isLocked ? (
              <span className="text-amber-400 font-medium">Kartlar kapanıyor...</span>
            ) : isMyTurn ? (
              <span className="text-accent-secondary font-semibold">Sıra sende — bir kart çevir</span>
            ) : (
              `${getPlayerName(gameState.players[currentPlayerIndex])} oynuyor...`
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
      <div className={`grid ${gridCols} gap-2.5 ${gridWidth}`}>
        {cards.map((card) => {
          const isMismatchCard = mismatchedCardIds.current.has(card.id);
          const visuallyFlipped = card.isFlipped && !(isMismatchCard && mismatchClosed);
          const isRevealed = visuallyFlipped || card.isMatched;
          const showSymbol = isRevealed && card.symbol !== '?';
          const canClick = isMyTurn && !isLocked && !finished && !card.isMatched && !visuallyFlipped;

          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={!canClick}
              className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${
                canClick ? 'cursor-pointer' : 'cursor-default'
              } ${
                card.isMatched
                  ? 'bg-emerald-600/20 border border-emerald-500/40 scale-95'
                  : isRevealed
                    ? `bg-bg-elevated border border-accent-primary/40 scale-105${isMismatchCard && !mismatchClosed ? ' border-red-400/50' : ''}`
                    : canClick
                      ? 'bg-bg-card border border-border-default hover:border-accent-primary/30 hover:bg-bg-elevated'
                      : 'bg-bg-card border border-border-default'
              }`}
            >
              {showSymbol ? (
                <span className="select-none">{card.symbol}</span>
              ) : (
                <span className="text-text-muted text-lg select-none">?</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Final scoreboard on finish */}
      {finished && (
        <div className="w-full mt-4 p-4 rounded-xl bg-bg-card border border-border-default">
          <h3 className="text-text-primary text-sm font-semibold mb-3 text-center">Skor Tablosu</h3>
          <div className="space-y-2">
            {[...gameState.players]
              .sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
              .map((playerId, idx) => (
                <div
                  key={playerId}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                    idx === 0 && winner === playerId
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-bg-elevated/50'
                  }`}
                >
                  <span className="text-text-primary text-sm">
                    {idx + 1}. {getPlayerName(playerId)}
                    {playerId === currentUserId && <span className="text-text-muted ml-1">(sen)</span>}
                  </span>
                  <span className="text-accent-secondary font-bold text-sm">
                    {scores[playerId] || 0} eş
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
