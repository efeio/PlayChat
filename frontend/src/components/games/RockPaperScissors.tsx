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

  /* Reset selected when new round starts */
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
          <p className="text-white font-semibold text-lg">
            {winner ? `${getPlayerName(winner)} wins the match!` : 'Match ends in a draw!'}
          </p>
        ) : (
          <p className="text-text-secondary text-sm">
            Round {Math.min(round, maxRounds)} of {maxRounds}
          </p>
        )}
      </div>

      {/* Last round result */}
      {lastRoundResult && (
        <p className="text-text-muted text-xs italic">
          {lastRoundResult === 'draw' 
            ? 'Round ended in a draw!' 
            : `${getPlayerName(lastRoundResult)} won the round!`}
        </p>
      )}

      {/* Scores */}
      <div className="flex gap-8">
        {gameState.players.map((pid) => (
          <div key={pid} className="text-center">
            <p className="text-white font-semibold text-2xl">{scores[pid] || 0}</p>
            <p className="text-text-secondary text-xs mt-1">{getPlayerName(pid)}</p>
          </div>
        ))}
      </div>

      {/* Choice buttons */}
      {!isFinished && (
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {(Object.keys(ICONS) as RPSChoice[]).map((choice) => (
            <button
              key={choice}
              onClick={() => handleChoice(choice)}
              disabled={hasChosen}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer disabled:cursor-default border ${
                selected === choice
                  ? 'bg-bg-surface border-border-focus shadow-[0_0_0_3px_rgba(250,204,21,0.08)]'
                  : 'bg-bg-elevated border-border-default hover:border-border-focus hover:bg-[rgba(250,204,21,0.05)]'
              } ${hasChosen && selected !== choice ? 'opacity-30' : ''}`}
            >
              <span className="text-2xl sm:text-3xl">{ICONS[choice]}</span>
              <span className="text-xs text-text-secondary capitalize">{choice}</span>
            </button>
          ))}
        </div>
      )}

      {/* Waiting indicator */}
      {hasChosen && !isFinished && (
        <p className="text-text-muted text-xs animate-pulse">
          Waiting for opponent to choose...
        </p>
      )}
    </div>
  );
}
