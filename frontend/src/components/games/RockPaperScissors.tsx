import { useState, useEffect } from 'react';

type RPSChoice = 'rock' | 'paper' | 'scissors';

interface RPSProps {
  gameState: {
    players: string[];
    choices: Record<string, RPSChoice | null>;
    round: number;
    scores: Record<string, number>;
    lastRoundResult: string | null;
    winner: string | null;
    maxRounds: number;
  };
  onMove: (move: { choice: RPSChoice }) => void;
  currentUserId: string;
  players: { userId: string; displayName: string }[];
}

const ICONS: Record<RPSChoice, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
};

export function RockPaperScissors({ gameState, onMove, currentUserId, players }: RPSProps) {
  const [selected, setSelected] = useState<RPSChoice | null>(null);
  const { choices, round, scores, lastRoundResult, winner, maxRounds } = gameState;
  const isFinished = !!winner || round > maxRounds;
  const hasChosen = choices[currentUserId] !== null;

  const getPlayerName = (id: string) =>
    players.find((p) => p.userId === id)?.displayName || id;

  const handleChoice = (choice: RPSChoice) => {
    if (hasChosen || isFinished) return;
    setSelected(choice);
    onMove({ choice });
  };

  useEffect(() => {
    if (!hasChosen && selected !== null) {
      setSelected(null);
    }
    return () => {
      setSelected(null);
    }
  }, [hasChosen, selected]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status */}
      <div className="text-center">
        {isFinished ? (
          <p className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-family-display)' }}>
            {winner ? `${getPlayerName(winner)} wins the match!` : 'Match ends in a draw!'}
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <span className="badge badge-waiting">
              Round {Math.min(round, maxRounds)}/{maxRounds}
            </span>
          </div>
        )}
      </div>

      {/* Last round result */}
      {lastRoundResult && (
        <div className="px-4 py-2 rounded-xl bg-bg-card border border-border-default text-sm">
          {lastRoundResult === 'draw'
            ? <span className="text-text-muted">El berabere!</span>
            : <span className="text-accent-secondary">{getPlayerName(lastRoundResult)} eli kazandı</span>}
        </div>
      )}

      {/* Scores */}
      <div className="flex gap-8 items-center">
        {gameState.players.map((pid, i) => (
          <div key={pid} className="text-center">
            <div className={`text-3xl font-black ${i === 0 ? 'text-indigo-400' : 'text-cyan-400'}`} style={{ fontFamily: 'var(--font-family-display)' }}>
              {scores[pid] || 0}
            </div>
            <p className="text-text-muted text-xs mt-1 font-medium">{getPlayerName(pid)}</p>
          </div>
        ))}
        <div className="absolute left-1/2 -translate-x-1/2 text-text-muted text-lg font-bold hidden">vs</div>
      </div>

      {/* Choice buttons */}
      {!isFinished && (
        <div className="flex flex-wrap justify-center gap-4">
          {(Object.keys(ICONS) as RPSChoice[]).map((choice) => (
            <button
              key={choice}
              onClick={() => handleChoice(choice)}
              disabled={hasChosen}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer disabled:cursor-default border ${
                selected === choice
                  ? 'bg-accent-primary/15 border-accent-primary/40 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-105'
                  : 'bg-bg-card border-border-default hover:border-accent-primary/30 hover:bg-accent-primary/5 hover:scale-105'
              } ${hasChosen && selected !== choice ? 'opacity-30 scale-95' : ''}`}
            >
              <span className="text-3xl sm:text-4xl">{ICONS[choice]}</span>
              <span className="text-[11px] text-text-secondary capitalize font-medium">{choice}</span>
            </button>
          ))}
        </div>
      )}

      {/* Waiting indicator */}
      {hasChosen && !isFinished && (
        <div className="flex items-center gap-2 text-text-muted text-xs">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
          Rakip bekleniyor...
        </div>
      )}
    </div>
  );
}
