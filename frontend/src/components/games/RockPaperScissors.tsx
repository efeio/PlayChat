import { useState, useEffect, type ReactNode } from 'react';

type RPSChoice = 'rock' | 'paper' | 'scissors';

interface RPSProps {
  gameState: {
    players: string[];
    choices: Record<string, RPSChoice | 'chosen' | null>;
    round: number;
    scores: Record<string, number>;
    lastRoundResult: string | null;
    winner: string | null;
    maxRounds?: number;
    winsNeeded?: number;
  };
  onMove: (move: { choice: RPSChoice }) => void;
  currentUserId: string;
  players: { userId: string; displayName: string }[];
}

const CHOICE_LABELS: Record<RPSChoice, string> = {
  rock: 'Taş',
  paper: 'Kağıt',
  scissors: 'Makas',
};

function RockIcon({ className }: { className?: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 12.5V10a2 2 0 0 0-2-2 2 2 0 0 0-2 2v1.4" />
      <path d="M14 11V9a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V5a2 2 0 0 0-2-2 2 2 0 0 0-2 2v9" />
      <path d="M18 12a2 2 0 0 1 2 2v1a8 8 0 0 1-8 8h-2a8 8 0 0 1-4-1.5" />
    </svg>
  );
}

function PaperIcon({ className }: { className?: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
    </svg>
  );
}

function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

const CHOICE_ICONS: Record<RPSChoice, (className?: string) => ReactNode> = {
  rock: (className) => <RockIcon className={className} />,
  paper: (className) => <PaperIcon className={className} />,
  scissors: (className) => <ScissorsIcon className={className} />,
};

export function RockPaperScissors({ gameState, onMove, currentUserId, players }: RPSProps) {
  const [selected, setSelected] = useState<RPSChoice | null>(null);
  const { choices, round, scores, lastRoundResult, winner, winsNeeded } = gameState;
  const targetWins = winsNeeded || 3;
  const isFinished = !!winner;
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
    <div className="flex flex-col items-center gap-6 w-full max-w-md p-6">
      {/* Title */}
      <h2 className="text-xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-family-display)' }}>
        Taş Kağıt Makas
      </h2>

      {/* Status */}
      <div className="text-center">
        {isFinished ? (
          <p className="text-accent-secondary font-bold text-lg">
            {getPlayerName(winner!)} kazandı!
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-bg-elevated text-text-muted text-xs font-medium">
              {targetWins} galibiyet kazanır · Tur {Math.min(round, 99)}
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
      <div className="flex items-center gap-6 w-full justify-center">
        {gameState.players.map((pid, i) => (
          <div key={pid} className="flex flex-col items-center gap-1 bg-bg-card border border-border-default rounded-2xl px-6 py-4 min-w-[100px]">
            <div className={`text-3xl font-black ${i === 0 ? 'text-indigo-400' : 'text-cyan-400'}`} style={{ fontFamily: 'var(--font-family-display)' }}>
              {scores[pid] || 0}
            </div>
            <p className="text-text-muted text-xs font-medium">{getPlayerName(pid)}</p>
            <div className="w-full bg-bg-elevated rounded-full h-1.5 mt-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${i === 0 ? 'bg-indigo-400' : 'bg-cyan-400'}`}
                style={{ width: `${((scores[pid] || 0) / targetWins) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Choice buttons */}
      {!isFinished && (
        <div className="flex flex-wrap justify-center gap-4">
          {(Object.keys(CHOICE_LABELS) as RPSChoice[]).map((choice) => (
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
              {CHOICE_ICONS[choice](selected === choice ? 'text-accent-primary' : 'text-text-secondary')}
              <span className="text-[11px] text-text-secondary font-medium">{CHOICE_LABELS[choice]}</span>
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
