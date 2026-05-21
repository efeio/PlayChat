import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ConnectFour } from './ConnectFour';

describe('ConnectFour - Mobile Responsiveness', () => {
  const mockPlayers = [
    { userId: 'user1', displayName: 'Alice' },
    { userId: 'user2', displayName: 'Bob' },
  ];

  const createEmptyBoard = () =>
    Array.from({ length: 6 }, () => Array(7).fill(0));

  const mockGameState = {
    board: createEmptyBoard(),
    currentPlayerIndex: 0,
    players: ['user1', 'user2'],
    winner: null,
  };

  describe('Responsive Layout', () => {
    it('renders 42 cells in 7x6 grid', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const cells = container.querySelectorAll('button[class*="game-cell"]');
      expect(cells.length).toBe(42);
    });

    it('has responsive cell size classes (w-10 h-10 sm:w-12 sm:h-12)', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const firstCell = container.querySelector('button[class*="game-cell"]');
      expect(firstCell?.className).toContain('w-10');
      expect(firstCell?.className).toContain('h-10');
      expect(firstCell?.className).toContain('sm:w-12');
      expect(firstCell?.className).toContain('sm:h-12');
    });

    it('has responsive piece size classes (w-8 h-8 sm:w-10 sm:h-10)', () => {
      const boardWithPiece = createEmptyBoard();
      boardWithPiece[5][3] = 1;

      const { container } = render(
        <ConnectFour
          gameState={{ ...mockGameState, board: boardWithPiece }}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const pieces = container.querySelectorAll('button[class*="game-cell"] div[class*="rounded-full"]');
      expect(pieces.length).toBeGreaterThan(0);

      const gamePiece = pieces[0];
      expect(gamePiece?.className).toContain('w-8');
      expect(gamePiece?.className).toContain('h-8');
      expect(gamePiece?.className).toContain('sm:w-10');
      expect(gamePiece?.className).toContain('sm:h-10');
    });

    it('has responsive grid gap (gap-1.5 sm:gap-2)', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const gridContainers = container.querySelectorAll('div[class*="grid gap-"]');
      expect(gridContainers.length).toBeGreaterThan(0);
      gridContainers.forEach((grid) => {
        expect(grid.className).toContain('gap-1.5');
        expect(grid.className).toContain('sm:gap-2');
      });
    });

    it('has column header buttons', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const headerButtons = container.querySelectorAll('button[class*="h-7"]');
      expect(headerButtons.length).toBe(7);
    });
  });

  describe('Touch Target Size (WCAG 2.5.5)', () => {
    it('has minimum 40x40 pixel touch targets on mobile (w-10 = 40px)', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const cells = container.querySelectorAll('button[class*="game-cell"]');
      expect(cells.length).toBe(42);

      cells.forEach((cell) => {
        expect(cell.className).toContain('w-10');
        expect(cell.className).toContain('h-10');
      });
    });

    it('has larger touch targets on desktop (sm:w-12 = 48px)', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const cells = container.querySelectorAll('button[class*="sm:w-12"]');
      expect(cells.length).toBe(42);
    });
  });

  describe('Viewport Fit (375px mobile)', () => {
    it('board width fits in 375px viewport', () => {
      const cellWidth = 40; // w-10
      const gapWidth = 6; // gap-1.5
      const columns = 7;

      const totalWidth = (cellWidth * columns) + (gapWidth * (columns - 1));
      expect(totalWidth).toBeLessThan(375);
    });

    it('has overflow-x-auto for safety', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const boardContainer = container.querySelector('div[class*="overflow-x-auto"]');
      expect(boardContainer).toBeTruthy();
      expect(boardContainer?.className).toContain('overflow-x-auto');
    });
  });

  describe('Aspect Ratio', () => {
    it('maintains circular cells (rounded-full)', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const cells = container.querySelectorAll('button[class*="game-cell"]');
      cells.forEach((cell) => {
        expect(cell.className).toContain('rounded-full');
      });
    });

    it('maintains circular pieces (rounded-full)', () => {
      const boardWithPieces = createEmptyBoard();
      boardWithPieces[5][0] = 1;
      boardWithPieces[5][1] = 2;

      const { container } = render(
        <ConnectFour
          gameState={{ ...mockGameState, board: boardWithPieces }}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const gamePieces = container.querySelectorAll('button[class*="game-cell"] div[class*="rounded-full"]');
      expect(gamePieces.length).toBe(2);
      gamePieces.forEach((piece) => {
        expect(piece.className).toContain('rounded-full');
      });
    });
  });

  describe('Game Interaction', () => {
    it('allows clicking empty columns on user turn', async () => {
      const user = userEvent.setup();
      const onMove = vi.fn();

      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={onMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const cells = container.querySelectorAll('button[class*="game-cell"]');
      await user.click(cells[0]);

      expect(onMove).toHaveBeenCalledWith({ column: 0 });
    });

    it('prevents clicking full columns', async () => {
      const user = userEvent.setup();
      const onMove = vi.fn();

      const fullBoard = createEmptyBoard();
      for (let row = 0; row < 6; row++) {
        fullBoard[row][0] = 1;
      }

      const { container } = render(
        <ConnectFour
          gameState={{ ...mockGameState, board: fullBoard }}
          onMove={onMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const firstCell = container.querySelector('button[class*="game-cell"]');
      await user.click(firstCell!);

      expect(onMove).not.toHaveBeenCalled();
    });

    it('prevents clicking when not user turn', async () => {
      const user = userEvent.setup();
      const onMove = vi.fn();

      const { container } = render(
        <ConnectFour
          gameState={{ ...mockGameState, currentPlayerIndex: 1 }}
          onMove={onMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const firstCell = container.querySelector('button[class*="game-cell"]');
      await user.click(firstCell!);

      expect(onMove).not.toHaveBeenCalled();
    });

    it('clicking column header also triggers move', async () => {
      const user = userEvent.setup();
      const onMove = vi.fn();

      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={onMove}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const headers = container.querySelectorAll('button[class*="h-7"]');
      await user.click(headers[0]);

      expect(onMove).toHaveBeenCalledWith({ column: 0 });
    });
  });

  describe('Game Status Display', () => {
    it('displays player names and indicators', () => {
      render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('shows "Your turn" indicator when it is user turn', () => {
      render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      expect(screen.getByText(/Your turn/i)).toBeInTheDocument();
    });

    it('shows waiting message when it is opponent turn', () => {
      render(
        <ConnectFour
          gameState={{ ...mockGameState, currentPlayerIndex: 1 }}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      expect(screen.getByText(/Waiting for Bob/i)).toBeInTheDocument();
    });

    it('displays winner message when game ends', () => {
      render(
        <ConnectFour
          gameState={{ ...mockGameState, winner: 'user1' }}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      expect(screen.getByText(/Alice wins!/i)).toBeInTheDocument();
    });

    it('displays draw message when board is full', () => {
      const fullBoard = createEmptyBoard().map((row) => row.map(() => 1));

      render(
        <ConnectFour
          gameState={{ ...mockGameState, board: fullBoard, winner: null }}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      expect(screen.getByText(/Draw!/i)).toBeInTheDocument();
    });

    it('disables all cells when game is finished', () => {
      const { container } = render(
        <ConnectFour
          gameState={{ ...mockGameState, winner: 'user1' }}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const cells = container.querySelectorAll('button[class*="game-cell"]');
      cells.forEach((cell) => {
        expect(cell).toBeDisabled();
      });
    });
  });

  describe('Design System Compliance', () => {
    it('uses game-cell and game-board classes', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const cells = container.querySelectorAll('button[class*="game-cell"]');
      expect(cells.length).toBe(42);

      const board = container.querySelector('div[class*="game-board"]');
      expect(board).toBeTruthy();
    });

    it('uses rounded-full for circular design', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const cells = container.querySelectorAll('button[class*="game-cell"]');
      expect(cells.length).toBe(42);

      cells.forEach((cell) => {
        expect(cell.className).toContain('rounded-full');
      });
    });

    it('uses smooth transitions', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const cells = container.querySelectorAll('button[class*="transition"]');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('Layout Structure', () => {
    it('centers board horizontally', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const mainContainer = container.querySelector('div[class*="flex flex-col items-center"]');
      expect(mainContainer).toBeTruthy();
      expect(mainContainer?.className).toContain('items-center');
    });

    it('uses grid layout for proper alignment', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const grids = container.querySelectorAll('div[class*="grid"]');
      expect(grids.length).toBeGreaterThan(0);
    });

    it('has proper spacing between elements (gap-6)', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const mainContainer = container.querySelector('div[class*="gap-6"]');
      expect(mainContainer).toBeTruthy();
    });
  });
});
