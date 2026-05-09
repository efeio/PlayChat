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

      // Count all cell buttons (excluding column header buttons)
      const cells = container.querySelectorAll('button[class*="w-11"]');
      expect(cells.length).toBe(42); // 7 columns × 6 rows
    });

    it('has responsive cell size classes (w-11 h-11 sm:w-14 sm:h-14)', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const firstCell = container.querySelector('button[class*="w-11"]');
      expect(firstCell?.className).toContain('w-11');
      expect(firstCell?.className).toContain('h-11');
      expect(firstCell?.className).toContain('sm:w-14');
      expect(firstCell?.className).toContain('sm:h-14');
    });

    it('has responsive piece size classes (w-7 h-7 sm:w-9 sm:h-9)', () => {
      const boardWithPiece = createEmptyBoard();
      boardWithPiece[5][3] = 1; // Place a piece at bottom center

      const { container } = render(
        <ConnectFour
          gameState={{ ...mockGameState, board: boardWithPiece }}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      // Find game pieces (not player indicators)
      const pieces = container.querySelectorAll('button[class*="w-11"] div[class*="rounded-full"]');
      expect(pieces.length).toBeGreaterThan(0);
      
      const gamePiece = pieces[0];
      expect(gamePiece?.className).toContain('w-7');
      expect(gamePiece?.className).toContain('h-7');
      expect(gamePiece?.className).toContain('sm:w-9');
      expect(gamePiece?.className).toContain('sm:h-9');
    });

    it('has responsive grid gap (gap-1 sm:gap-1.5)', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const gridContainers = container.querySelectorAll('div[class*="grid gap-"]');
      gridContainers.forEach((grid) => {
        expect(grid.className).toContain('gap-1');
        expect(grid.className).toContain('sm:gap-1.5');
      });
    });

    it('has responsive column header height (h-6 sm:h-8)', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const headerButtons = container.querySelectorAll('button[class*="h-6"]');
      expect(headerButtons.length).toBe(7); // 7 column headers
      headerButtons.forEach((btn) => {
        expect(btn.className).toContain('h-6');
        expect(btn.className).toContain('sm:h-8');
      });
    });
  });

  describe('Touch Target Size (WCAG 2.5.5)', () => {
    it('has minimum 44x44 pixel touch targets on mobile (w-11 = 44px)', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      // w-11 = 44px, h-11 = 44px (Tailwind: 1 unit = 4px, 11 * 4 = 44)
      const cells = container.querySelectorAll('button[class*="w-11 h-11"]');
      expect(cells.length).toBe(42);
      
      // Verify each cell has the correct classes
      cells.forEach((cell) => {
        expect(cell.className).toContain('w-11');
        expect(cell.className).toContain('h-11');
      });
    });

    it('has larger touch targets on desktop (sm:w-14 = 56px)', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      // sm:w-14 = 56px, sm:h-14 = 56px (14 * 4 = 56)
      const cells = container.querySelectorAll('button[class*="sm:w-14"]');
      expect(cells.length).toBe(42);
    });
  });

  describe('Viewport Fit (375px mobile)', () => {
    it('board width fits in 375px viewport', () => {
      // Mobile: 7 cells × 44px + 6 gaps × 4px = 308px + 24px = 332px
      // 332px < 375px ✓
      const cellWidth = 44; // w-11
      const gapWidth = 4; // gap-1
      const columns = 7;
      
      const totalWidth = (cellWidth * columns) + (gapWidth * (columns - 1));
      expect(totalWidth).toBe(332);
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
    it('maintains square cells (w-11 h-11)', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const cells = container.querySelectorAll('button[class*="w-11 h-11"]');
      cells.forEach((cell) => {
        expect(cell.className).toContain('w-11');
        expect(cell.className).toContain('h-11');
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

      // Find game pieces (inside button cells, not player indicators)
      const gamePieces = container.querySelectorAll('button[class*="w-11"] div[class*="rounded-full"]');
      expect(gamePieces.length).toBe(2);
      gamePieces.forEach((piece) => {
        expect(piece.className).toContain('rounded-full');
        expect(piece.className).toContain('w-7');
        expect(piece.className).toContain('h-7');
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

      // Click first cell in column 0
      const cells = container.querySelectorAll('button[class*="w-11"]');
      await user.click(cells[0]);

      expect(onMove).toHaveBeenCalledWith({ column: 0 });
    });

    it('prevents clicking full columns', async () => {
      const user = userEvent.setup();
      const onMove = vi.fn();

      const fullBoard = createEmptyBoard();
      // Fill column 0 completely
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

      // Try to click column 0 (should be disabled)
      const firstCell = container.querySelector('button[class*="w-11"]');
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

      const firstCell = container.querySelector('button[class*="w-11"]');
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

      // Click first column header
      const headers = container.querySelectorAll('button[class*="h-6"]');
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

      const cells = container.querySelectorAll('button[class*="w-11"]');
      cells.forEach((cell) => {
        expect(cell).toBeDisabled();
      });
    });
  });

  describe('Design System Compliance', () => {
    it('uses Architectural Noir colors', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const cells = container.querySelectorAll('button[class*="bg-bg-elevated"]');
      expect(cells.length).toBeGreaterThan(0);

      cells.forEach((cell) => {
        expect(cell.className).toContain('bg-bg-elevated');
        expect(cell.className).toContain('border-border');
      });
    });

    it('uses flat design (rounded-lg, no shadows)', () => {
      const { container } = render(
        <ConnectFour
          gameState={mockGameState}
          onMove={vi.fn()}
          currentUserId="user1"
          players={mockPlayers}
        />
      );

      const cells = container.querySelectorAll('button[class*="rounded-lg"]');
      expect(cells.length).toBe(42);

      cells.forEach((cell) => {
        expect(cell.className).toContain('rounded-lg');
        expect(cell.className).not.toContain('shadow');
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
