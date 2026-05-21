import type { ReactNode } from 'react';

export const GAME_ICONS: Record<string, ReactNode> = {
  GENERAL: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 20h12M12 4v12M8 8l4-4 4 4" />
    </svg>
  ),
  TIC_TAC_TOE: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
      <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
    </svg>
  ),
  CONNECT_FOUR: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="8" cy="8" r="2.5" /><circle cx="16" cy="8" r="2.5" />
      <circle cx="8" cy="16" r="2.5" /><circle cx="16" cy="16" r="2.5" fill="currentColor" />
    </svg>
  ),
  ROCK_PAPER_SCISSORS: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 12.5V10a2 2 0 0 0-2-2 2 2 0 0 0-2 2v1.4" />
      <path d="M14 11V9a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V5a2 2 0 0 0-2-2 2 2 0 0 0-2 2v9" />
      <path d="M18 12a2 2 0 0 1 2 2v1a8 8 0 0 1-8 8h-2a8 8 0 0 1-4-1.5" />
    </svg>
  ),
  HANGMAN: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21h4M7 21V3M7 3h8M15 3v4" />
      <circle cx="15" cy="9" r="2" />
      <path d="M15 11v4M13 13h4M15 15l-2 3M15 15l2 3" />
    </svg>
  ),
  WORDLE: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="5" height="5" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="9.5" y="5" width="5" height="5" rx="1" />
      <rect x="16" y="5" width="5" height="5" rx="1" />
      <rect x="3" y="14" width="5" height="5" rx="1" />
      <rect x="9.5" y="14" width="5" height="5" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="16" y="14" width="5" height="5" rx="1" />
    </svg>
  ),
  MEMORY_CARDS: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="8" height="11" rx="1.5" />
      <rect x="14" y="4" width="8" height="11" rx="1.5" />
      <path d="M5 8h2M17 8h2" />
      <path d="M6 19l3-3M18 19l-3-3" />
    </svg>
  ),
  NUMBER_GUESS: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h2M4 12h2M4 19h2" />
      <path d="M10 5h10M10 12h7M10 19h10" />
      <circle cx="20" cy="12" r="2" fill="currentColor" opacity="0.4" />
    </svg>
  ),
};
