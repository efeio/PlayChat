import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RockPaperScissors.css';

const choices = [
  { id: 'tas', icon: '🪨', label: 'ROCK' },
  { id: 'kagit', icon: '📄', label: 'PAPER' },
  { id: 'makas', icon: '✂️', label: 'SCISSORS' },
];

export const RockPaperScissors: React.FC = () => {
  const [gameData, setGameData] = useState<any>(null);
  const [score, setScore] = useState({ player: 0, cpu: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  const play = async (choiceId: string) => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    try {
      const res = await fetch('http://localhost:3001/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerChoice: choiceId }),
      });
      const data = await res.json();
      
      setTimeout(() => {
        setGameData(data);
        if (data.result === 'Kazandın!') setScore(s => ({ ...s, player: s.player + 1 }));
        if (data.result === 'Kaybettin!') setScore(s => ({ ...s, cpu: s.cpu + 1 }));
        setIsAnimating(false);
      }, 600);
      
    } catch (error) {
      console.error("Connection failed", error);
      setIsAnimating(false);
    }
  };

  const handleReset = () => {
    setGameData(null);
    setScore({ player: 0, cpu: 0 });
  };

  const handleNewGame = () => {
    setGameData(null);
  };

  return (
    <div className="rps-root">
      {/* Header */}
      <div className="rps-header">
        <span className="rps-title">Rock-Paper-Scissors</span>
        <div className="rps-status-badge">
          <div className="rps-dot" />
          {isAnimating ? "PROCESSING" : "IN PROGRESS"}
        </div>
      </div>

      {/* Players */}
      <div className="rps-players">
        <div className={`rps-player-row ${!isAnimating ? 'active' : ''}`}>
          <div className="rps-player-symbol p1-symbol">X</div>
          <span className="rps-player-name">Efe</span>
          <span className={`rps-player-status ${!isAnimating ? 'active-status' : ''}`}>
            {!isAnimating ? 'Active' : 'Waiting'}
          </span>
        </div>
        <div className={`rps-player-row ${isAnimating ? 'active' : ''}`}>
          <div className="rps-player-symbol">O</div>
          <span className="rps-player-name">CPU</span>
          <span className={`rps-player-status ${isAnimating ? 'active-status' : ''}`}>
            {isAnimating ? 'Thinking' : 'Waiting'}
          </span>
        </div>
      </div>

      {/* Main Display Area (The Result) */}
      <div className="rps-display-container">
        <div className="rps-display-area">
          <div className="rps-display-grid" />
          <AnimatePresence mode="wait">
            {isAnimating ? (
              <motion.div 
                key="thinking"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rps-waiting-text"
              >
                Deciding Hamle...
              </motion.div>
            ) : gameData ? (
              <motion.div 
                key="result"
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="rps-result-content"
              >
                <div className="rps-result-icons">
                  <div className="rps-result-player">
                    <span className="rps-result-label">YOU</span>
                    <span className="rps-result-icon">{choices.find(c => c.id === gameData.playerChoice)?.icon}</span>
                  </div>
                  <span className="rps-vs-text">VS</span>
                  <div className="rps-result-player">
                    <span className="rps-result-label">CPU</span>
                    <span className="rps-result-icon">{choices.find(c => c.id === gameData.cpuChoice)?.icon}</span>
                  </div>
                </div>
                <div className={`rps-result-msg ${
                  gameData.result === 'Kazandın!' ? 'winner' : 
                  gameData.result === 'Kaybettin!' ? 'loser' : ''
                }`}>
                  {gameData.result}
                </div>
              </motion.div>
            ) : (
              <div className="rps-waiting-text">Awaiting Move...</div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Control Area (The Board) */}
      <div className="rps-board-container">
        <div className="rps-board-label">Choose your weapon</div>
        <div className="rps-board">
          {choices.map((item) => (
            <button
              key={item.id}
              onClick={() => play(item.id)}
              disabled={isAnimating}
              className="rps-choice-btn"
            >
              <span className="rps-choice-icon">{item.icon}</span>
              <span className="rps-choice-label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scores */}
      <div className="rps-scores">
        <div className="rps-score-item">
          <span className="rps-score-name">Efe</span>
          <span className="rps-score-val">{score.player}</span>
        </div>
        <span className="rps-score-sep">—</span>
        <div className="rps-score-item">
          <span className="rps-score-val">{score.cpu}</span>
          <span className="rps-score-name text-right">CPU</span>
        </div>
      </div>

      {/* Footer */}
      <div className="rps-footer">
        <button className="rps-btn" onClick={handleReset}>
          Reset
        </button>
        <button className="rps-btn primary" onClick={handleNewGame}>
          New Round
        </button>
      </div>
    </div>
  );
};
