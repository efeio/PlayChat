import React from 'react';
import { CellValue } from '../types';
import './Cell.module.css';

interface CellProps {
  value: CellValue;
  index: number;
  onClick: (i: number) => void;
  isWinning: boolean;
  disabled: boolean;
}

export const Cell: React.FC<CellProps> = ({
  value,
  index,
  onClick,
  isWinning,
  disabled,
}) => {
  return (
    <button
      aria-label={`Hücre ${index}, ${value ? `Durum: ${value}` : "Boş"}`}
      onClick={() => onClick(index)}
      disabled={disabled || !!value}
      style={{
        background: isWinning
          ? "rgba(255,255,255,0.07)"
          : value
          ? "rgba(255,255,255,0.03)"
          : "rgba(255,255,255,0.02)",
        border: isWinning
          ? "1px solid rgba(255,255,255,0.25)"
          : "1px solid rgba(255,255,255,0.06)",
      }}
      className={`ttt-cell ${isWinning ? "winning" : ""} ${value ? "filled" : ""}`}
    >
      {!value && !disabled && <span className="ttt-cell-hover" />}
      
      {value && (
        <span className={`ttt-cell-value ${value === "X" ? "val-x" : "val-o"} ${isWinning ? "val-winning" : ""}`}>
          {value}
        </span>
      )}
    </button>
  );
};
