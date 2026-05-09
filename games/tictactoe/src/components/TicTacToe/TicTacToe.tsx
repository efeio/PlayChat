import React, { useState, useCallback, useEffect } from "react";
import { Cell } from "../Cell";
import { GameState, Player } from "../../types";
import { checkWinner, getWinningCells, PLAYERS, initialState } from "../../utils/gameLogic";
import "./TicTacToe.css";

export const TicTacToe: React.FC = () => {
  const [game, setGame] = useState<GameState>(initialState("X"));
  const [winCells, setWinCells] = useState<number[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  const handleClick = useCallback((index: number) => {
    setGame((prev) => {
      if (prev.winner || prev.board[index] || prev.status !== "playing") {
        return prev;
      }

      const newBoard = [...prev.board];
      newBoard[index] = prev.currentPlayer;
      
      const winner = checkWinner(newBoard);
      const newScores = { ...prev.scores };
      
      if (winner && winner !== "draw") {
        newScores[winner]++;
      }

      return {
        ...prev,
        board: newBoard,
        currentPlayer: prev.currentPlayer === "X" ? "O" : "X",
        winner,
        scores: newScores,
        status: winner ? "finished" : "playing",
      };
    });
  }, []);

  useEffect(() => {
    if (game.winner) {
      const cells = getWinningCells(game.board);
      setWinCells(cells);
      setFlash(
        game.winner === "draw"
          ? "DRAW"
          : `${PLAYERS.find((p) => p.symbol === game.winner)?.name ?? game.winner} WINS`
      );
    }
  }, [game.winner, game.board]);

  const handleNewGame = () => {
    setGame((prev) => {
      const nextStarter = prev.startingPlayer === "X" ? "O" : "X";
      return {
        ...initialState(nextStarter),
        scores: prev.scores,
        round: prev.round + 1,
      };
    });
    setWinCells([]);
    setFlash(null);
  };

  const handleReset = () => {
    setGame(initialState("X"));
    setWinCells([]);
    setFlash(null);
  };

  const currentPlayerInfo = PLAYERS.find((p) => p.symbol === game.currentPlayer)!;

  return (
    <div className="ttt-root">
      {/* Header */}
      <div className="ttt-header">
        <span className="ttt-title">Tic-Tac-Toe</span>
        <div className="ttt-status-badge">
          <div className="ttt-dot" />
          {game.status === "finished" ? "FINISHED" : "IN PROGRESS"}
        </div>
      </div>

      {/* Players */}
      <div className="ttt-players">
        {PLAYERS.map((p) => {
          const isCurrentTurn = game.currentPlayer === p.symbol && game.status === "playing";
          return (
            <div
              key={p.symbol}
              className={`ttt-player-row${isCurrentTurn ? " active" : ""}`}
            >
              <div
                className={`ttt-player-symbol ${
                  p.symbol === "X" ? "x-symbol" : "o-symbol"
                }`}
              >
                {p.symbol}
              </div>
              <span className="ttt-player-name">{p.name}</span>
              <span
                className={`ttt-player-status${isCurrentTurn ? " active-status" : ""}`}
              >
                {game.status === "finished"
                  ? game.winner === p.symbol
                    ? "Winner"
                    : game.winner === "draw"
                    ? "Draw"
                    : "Lost"
                  : isCurrentTurn
                  ? "Active"
                  : "Waiting"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Board */}
      <div className="ttt-board-container">
        <div className="ttt-board">
          {game.board.map((cell, i) => (
            <Cell
              key={i}
              value={cell}
              index={i}
              onClick={handleClick}
              isWinning={winCells.includes(i)}
              disabled={game.status === "finished"}
            />
          ))}
        </div>

        {/* Result overlay */}
        {flash && (
          <div className="ttt-flash">
            <span className="ttt-flash-text">{flash}</span>
            <span className="ttt-flash-sub">
              {game.winner === "draw" ? "No winner this round" : "Round complete"}
            </span>
          </div>
        )}
      </div>

      {/* Waiting / Turn indicator */}
      {!game.winner && (
        <div className="ttt-waiting">
          {game.status === "playing"
            ? `Waiting for ${currentPlayerInfo.name}...`
            : "Waiting for opponent..."}
        </div>
      )}

      {/* Scores */}
      <div className="ttt-scores">
        <span className="ttt-score-label">
          {PLAYERS[0].name} {game.scores.X}
        </span>
        <span className="ttt-score-sep">—</span>
        <span className="ttt-score-round">Round {game.round}</span>
        <span className="ttt-score-sep">—</span>
        <span className="ttt-score-label">
          {game.scores.O} {PLAYERS[1].name}
        </span>
      </div>

      {/* Footer */}
      <div className="ttt-footer">
        <button className="ttt-btn" onClick={handleReset}>
          Reset
        </button>
        <button className="ttt-btn primary" onClick={handleNewGame}>
          New Game
        </button>
      </div>
    </div>
  );
};
