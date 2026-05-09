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
    guessedLetters: ['H', 'E'],
    wrongCount: 2,
    players: ['user1', 'user2'],
    winner: null,
    setter: 'user1',
    guesser: 'user2',
    roles: {
      user1: 'SETTER' as const,
      user2: 'GUESSER' as const,
    },
  };

  const mockOnMove = vi.fn();

  describe('Touch Target Requirements (Requirement 5.5)', () => {
    it('should have keyboard buttons with at least 44x44 pixel touch targets on mobile', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      // Find keyboard buttons (A-Z)
      const buttons = container.querySelectorAll('button');
      const letterButtons = Array.from(buttons).filter((btn) =>
        /^[A-Z]$/.test(btn.textContent || '')
      );

      expect(letterButtons.length).toBe(26); // All alphabet letters

      // Check that buttons have mobile-responsive size classes
      letterButtons.forEach((button) => {
        const classes = button.className;
        // Mobile: w-11 h-11 (44px x 44px)
        expect(classes).toContain('w-11');
        expect(classes).toContain('h-11');
        // Desktop: sm:w-12 sm:h-12 (48px x 48px)
        expect(classes).toContain('sm:w-12');
        expect(classes).toContain('sm:h-12');
      });
    });

    it('should have word guess button with adequate touch target height', () => {
      render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      const guessButton = screen.getByRole('button', { name: /guess/i });
      const classes = guessButton.className;

      // Button should have h-11 (44px height)
      expect(classes).toContain('h-11');
    });

    it('should have word guess input with adequate touch target height', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      const input = container.querySelector('input[placeholder="Guess the word..."]');
      expect(input).toBeTruthy();

      const classes = input?.className || '';
      // Input should have h-11 (44px height)
      expect(classes).toContain('h-11');
    });
  });

  describe('Stacked Layout (Requirement 5.4)', () => {
    it('should use vertical stacked layout with flex-col', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
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
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      const figure = container.querySelector('pre.font-mono');
      expect(figure).toBeTruthy();

      const figureContainer = figure?.parentElement;
      const classes = figureContainer?.className || '';

      // Mobile: w-32 h-40 (128px x 160px)
      expect(classes).toContain('w-32');
      expect(classes).toContain('h-40');
      // Desktop: sm:w-40 sm:h-48 (160px x 192px)
      expect(classes).toContain('sm:w-40');
      expect(classes).toContain('sm:h-48');
    });

    it('should display word with responsive tracking', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      // Find the word display element
      const wordDisplay = container.querySelector('.tracking-\\[0\\.2em\\]');
      expect(wordDisplay).toBeTruthy();

      const classes = wordDisplay?.className || '';
      // Mobile: tracking-[0.2em]
      expect(classes).toContain('tracking-[0.2em]');
      // Desktop: sm:tracking-[0.3em]
      expect(classes).toContain('sm:tracking-[0.3em]');
      // Responsive text size
      expect(classes).toContain('text-xl');
      expect(classes).toContain('sm:text-2xl');
    });

    it('should have keyboard with flex-wrap for mobile wrapping', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      // Find the keyboard container
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
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      const keyboardContainer = container.querySelector('.flex-wrap');
      const classes = keyboardContainer?.className || '';

      // Mobile: gap-1.5 (6px)
      expect(classes).toContain('gap-1.5');
      // Desktop: sm:gap-2 (8px)
      expect(classes).toContain('sm:gap-2');
    });
  });

  describe('Viewport Fit', () => {
    it('should have max-width constraint on keyboard for mobile', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      const keyboardContainer = container.querySelector('.flex-wrap');
      const classes = keyboardContainer?.className || '';

      // Should have max-w-md to prevent overflow
      expect(classes).toContain('max-w-md');
    });

    it('should have padding on keyboard container for mobile spacing', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      const keyboardContainer = container.querySelector('.flex-wrap');
      const classes = keyboardContainer?.className || '';

      // Should have px-2 for horizontal padding
      expect(classes).toContain('px-2');
    });

    it('should have max-width constraint on word guess input', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      const inputContainer = container.querySelector('.max-w-xs');
      expect(inputContainer).toBeTruthy();

      const classes = inputContainer?.className || '';
      expect(classes).toContain('max-w-xs');
      expect(classes).toContain('px-4'); // Horizontal padding
    });
  });

  describe('Role Display Responsiveness', () => {
    it('should have responsive layout for role indicators', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      // Find the roles container
      const rolesContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(rolesContainer).toBeTruthy();

      const classes = rolesContainer?.className || '';
      // Mobile: flex-col (stacked)
      expect(classes).toContain('flex-col');
      // Desktop: sm:flex-row (horizontal)
      expect(classes).toContain('sm:flex-row');
      // Responsive gap
      expect(classes).toContain('gap-2');
      expect(classes).toContain('sm:gap-6');
    });
  });

  describe('Architectural Noir Design System', () => {
    it('should use design system colors for keyboard buttons', () => {
      const { container } = render(
        <Hangman
          gameState={{
            ...mockGameState,
            guessedLetters: [], // No letters guessed yet
          }}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      const buttons = container.querySelectorAll('button');
      const letterButtons = Array.from(buttons).filter((btn) =>
        /^[A-Z]$/.test(btn.textContent || '')
      );

      // Check unused buttons (should have default design system colors)
      const unusedButton = letterButtons[0]; // First button (A)
      const classes = unusedButton.className;
      
      // Should use bg-elevated, text-primary for unused buttons
      expect(classes).toContain('bg-bg-elevated');
      expect(classes).toContain('text-text-primary');
    });

    it('should use flat design with rounded corners', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      const buttons = container.querySelectorAll('button');
      const letterButtons = Array.from(buttons).filter((btn) =>
        /^[A-Z]$/.test(btn.textContent || '')
      );

      letterButtons.forEach((button) => {
        const classes = button.className;
        // Should have rounded-lg (no shadows)
        expect(classes).toContain('rounded-lg');
        // Should have transition for smooth interactions
        expect(classes).toContain('transition-colors');
      });
    });

    it('should use design system colors for hangman figure container', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      const figure = container.querySelector('pre.font-mono');
      const figureContainer = figure?.parentElement;
      const classes = figureContainer?.className || '';

      expect(classes).toContain('bg-bg-elevated');
      expect(classes).toContain('rounded-xl');
    });
  });

  describe('Game Functionality', () => {
    it('should display all 26 alphabet letters', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
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
      render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      // Word is "HELLO", guessed letters are "H" and "E"
      // Should display: "H E _ _ _"
      const wordDisplay = screen.getByText(/H E/);
      expect(wordDisplay).toBeTruthy();
    });

    it('should display role information', () => {
      render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      expect(screen.getByText(/Word Setter:/)).toBeTruthy();
      expect(screen.getByText(/Word Guesser:/)).toBeTruthy();
      expect(screen.getByText('Player 1')).toBeTruthy();
      expect(screen.getByText('Player 2')).toBeTruthy();
    });

    it('should show guesser status message', () => {
      render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      expect(screen.getByText('Guess the word!')).toBeTruthy();
    });

    it('should show setter waiting message', () => {
      render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      expect(screen.getByText(/Waiting for Player 2 to guess.../)).toBeTruthy();
    });

    it('should display remaining guesses', () => {
      render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      // MAX_WRONG = 6, wrongCount = 2, so 4 guesses remaining
      expect(screen.getByText(/4 guesses remaining/)).toBeTruthy();
    });

    it('should not show keyboard for setter', () => {
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

      // Setter should not see keyboard
      expect(letterButtons.length).toBe(0);
    });

    it('should show keyboard for guesser', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      const buttons = container.querySelectorAll('button');
      const letterButtons = Array.from(buttons).filter((btn) =>
        /^[A-Z]$/.test(btn.textContent || '')
      );

      // Guesser should see all 26 letters
      expect(letterButtons.length).toBe(26);
    });

    it('should display winner message when game ends', () => {
      const finishedGameState = {
        ...mockGameState,
        winner: 'user2',
      };

      render(
        <Hangman
          gameState={finishedGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      expect(screen.getByText(/Player 2 guessed the word!/)).toBeTruthy();
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
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      const buttons = container.querySelectorAll('button');
      const letterButtons = Array.from(buttons).filter((btn) =>
        /^[A-Z]$/.test(btn.textContent || '')
      );

      // No keyboard when game is finished
      expect(letterButtons.length).toBe(0);
    });
  });

  describe('Responsive Text Sizing', () => {
    it('should have responsive text size for hangman figure', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      const figure = container.querySelector('pre.font-mono');
      const classes = figure?.className || '';

      // Mobile: text-base (16px)
      expect(classes).toContain('text-base');
      // Desktop: sm:text-lg (18px)
      expect(classes).toContain('sm:text-lg');
    });

    it('should have responsive text size for keyboard buttons', () => {
      const { container } = render(
        <Hangman
          gameState={mockGameState}
          onMove={mockOnMove}
          currentUserId="user2"
          players={mockPlayers}
        />
      );

      const buttons = container.querySelectorAll('button');
      const letterButtons = Array.from(buttons).filter((btn) =>
        /^[A-Z]$/.test(btn.textContent || '')
      );

      letterButtons.forEach((button) => {
        const classes = button.className;
        // Mobile: text-sm (14px)
        expect(classes).toContain('text-sm');
        // Desktop: sm:text-base (16px)
        expect(classes).toContain('sm:text-base');
      });
    });
  });
});
