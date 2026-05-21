import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hangman } from './Hangman';

describe('Hangman Mobile Responsiveness', () => {
  const mockPlayers = [
    { userId: 'user1', displayName: 'Player 1' },
    { userId: 'user2', displayName: 'Player 2' },
  ];

  const mockGameState = {
    word: 'HELLO',
    players: ['user1', 'user2'],
    winner: null as string | null,
    draw: false,
    playerStates: {
      user1: { guessedLetters: ['H'], wrongCount: 1 },
      user2: { guessedLetters: ['H', 'E'], wrongCount: 2 },
    },
  };

  const mockOnMove = vi.fn();

  describe('Touch Target Requirements', () => {
    it('should have keyboard buttons with responsive size', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const buttons = container.querySelectorAll('button');
      const letterButtons = Array.from(buttons).filter((btn) =>
        /^[A-Z]$/.test(btn.textContent || '')
      );

      expect(letterButtons.length).toBe(26);

      letterButtons.forEach((button) => {
        const classes = button.className;
        expect(classes).toContain('w-9');
        expect(classes).toContain('h-9');
        expect(classes).toContain('sm:w-10');
        expect(classes).toContain('sm:h-10');
      });
    });

    it('should have word guess button with adequate touch target height', () => {
      render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const guessButton = screen.getByRole('button', { name: /guess/i });
      const classes = guessButton.className;
      expect(classes).toContain('h-[44px]');
    });

    it('should have word guess input', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const input = container.querySelector('input[placeholder="Guess the word..."]');
      expect(input).toBeTruthy();
    });
  });

  describe('Stacked Layout', () => {
    it('should use vertical stacked layout with flex-col', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('flex');
      expect(mainContainer.className).toContain('flex-col');
      expect(mainContainer.className).toContain('items-center');
    });

    it('should display hangman figure with responsive sizing', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const figure = container.querySelector('pre.font-mono');
      expect(figure).toBeTruthy();

      const figureContainer = figure?.parentElement;
      const classes = figureContainer?.className || '';

      expect(classes).toContain('w-36');
      expect(classes).toContain('h-44');
      expect(classes).toContain('sm:w-40');
      expect(classes).toContain('sm:h-48');
    });

    it('should display word with responsive tracking', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const wordDisplay = container.querySelector('.tracking-\\[0\\.2em\\]');
      expect(wordDisplay).toBeTruthy();

      const classes = wordDisplay?.className || '';
      expect(classes).toContain('tracking-[0.2em]');
      expect(classes).toContain('sm:tracking-[0.3em]');
      expect(classes).toContain('text-xl');
      expect(classes).toContain('sm:text-2xl');
    });

    it('should have keyboard with flex-wrap for mobile wrapping', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const keyboardContainer = container.querySelector('.flex-wrap');
      expect(keyboardContainer).toBeTruthy();

      const classes = keyboardContainer?.className || '';
      expect(classes).toContain('flex');
      expect(classes).toContain('flex-wrap');
      expect(classes).toContain('justify-center');
    });

    it('should have responsive gap spacing in keyboard', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const keyboardContainer = container.querySelector('.flex-wrap');
      const classes = keyboardContainer?.className || '';

      expect(classes).toContain('gap-1.5');
      expect(classes).toContain('sm:gap-2');
    });
  });

  describe('Viewport Fit', () => {
    it('should have max-width constraint on keyboard for mobile', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const keyboardContainer = container.querySelector('.flex-wrap');
      const classes = keyboardContainer?.className || '';
      expect(classes).toContain('max-w-md');
    });

    it('should have max-width constraint on word guess input', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const inputContainer = container.querySelector('.max-w-xs');
      expect(inputContainer).toBeTruthy();
    });
  });

  describe('Design System Compliance', () => {
    it('should use design system colors for keyboard buttons', () => {
      const gameWithNoGuesses = {
        ...mockGameState,
        playerStates: {
          user1: { guessedLetters: [] as string[], wrongCount: 0 },
          user2: { guessedLetters: [] as string[], wrongCount: 0 },
        },
      };

      const { container } = render(
        <Hangman
          gameState={gameWithNoGuesses}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const buttons = container.querySelectorAll('button');
      const letterButtons = Array.from(buttons).filter((btn) =>
        /^[A-Z]$/.test(btn.textContent || '')
      );

      const unusedButton = letterButtons[0];
      const classes = unusedButton.className;

      expect(classes).toContain('bg-bg-card');
      expect(classes).toContain('text-white');
      expect(classes).toContain('border-border-default');
    });

    it('should use rounded corners for buttons', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const buttons = container.querySelectorAll('button');
      const letterButtons = Array.from(buttons).filter((btn) =>
        /^[A-Z]$/.test(btn.textContent || '')
      );

      letterButtons.forEach((button) => {
        expect(button.className).toContain('rounded-lg');
      });
    });

    it('should use game-board class for hangman figure container', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const figure = container.querySelector('pre.font-mono');
      const figureContainer = figure?.parentElement;
      const classes = figureContainer?.className || '';
      expect(classes).toContain('game-board');
    });
  });

  describe('Game Functionality', () => {
    it('should display all 26 alphabet letters for active player', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const buttons = container.querySelectorAll('button');
      const letterButtons = Array.from(buttons).filter((btn) =>
        /^[A-Z]$/.test(btn.textContent || '')
      );

      expect(letterButtons.length).toBe(26);
    });

    it('should show masked word with guessed letters revealed', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      // user1 has guessed 'H' so word is "H _ _ _ _"
      const wordDisplay = container.querySelector('.tracking-\\[0\\.2em\\]');
      expect(wordDisplay).toBeTruthy();
      expect(wordDisplay?.textContent).toContain('H');
      expect(wordDisplay?.textContent).toContain('_');
    });

    it('should display opponent status', () => {
      render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      expect(screen.getByText(/Player 2/)).toBeTruthy();
    });

    it('should show competitive status message', () => {
      render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      expect(screen.getByText(/Guess the word before your opponent!/)).toBeTruthy();
    });

    it('should display remaining guesses', () => {
      render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      // user1 wrongCount = 1, so 5 guesses remaining
      expect(screen.getByText(/5 left/)).toBeTruthy();
    });

    it('should display winner message when game ends', () => {
      const finishedGameState = {
        ...mockGameState,
        winner: 'user1',
      };

      render(
        <Hangman
          gameState={finishedGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      expect(screen.getByText(/You guessed the word!/)).toBeTruthy();
    });

    it('should hide keyboard when game is finished', () => {
      const finishedGameState = {
        ...mockGameState,
        winner: 'user2',
      };

      const { container } = render(
        <Hangman
          gameState={finishedGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const buttons = container.querySelectorAll('button');
      const letterButtons = Array.from(buttons).filter((btn) =>
        /^[A-Z]$/.test(btn.textContent || '')
      );

      expect(letterButtons.length).toBe(0);
    });
  });

  describe('Responsive Text Sizing', () => {
    it('should have responsive text size for hangman figure', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const figure = container.querySelector('pre.font-mono');
      const classes = figure?.className || '';

      expect(classes).toContain('text-base');
      expect(classes).toContain('sm:text-lg');
    });

    it('should have responsive text size for keyboard buttons', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const buttons = container.querySelectorAll('button');
      const letterButtons = Array.from(buttons).filter((btn) =>
        /^[A-Z]$/.test(btn.textContent || '')
      );

      letterButtons.forEach((button) => {
        const classes = button.className;
        expect(classes).toContain('text-xs');
        expect(classes).toContain('sm:text-sm');
      });
    });
  });
});
