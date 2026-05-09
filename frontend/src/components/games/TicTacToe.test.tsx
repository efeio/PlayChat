import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TicTacToe } from './TicTacToe';

describe('TicTacToe Mobile Responsiveness', () => {
  const mockPlayers = [
    { userId: 'user1', displayName: 'Alice' },
    { userId: 'user2', displayName: 'Bob' },
  ];

  const mockGameState = {
    board: [null, 'X', 'O', 'X', null, null, null, 'O', null],
    currentPlayerIndex: 0,
    players: ['user1', 'user2'],
    winner: null,
  };

  const mockOnMove = vi.fn();

  it('should render 9 cells in a 3x3 grid', () => {
    render(
      <TicTacToe
        gameState={mockGameState}
        onMove={mockOnMove}
        currentUserId="user1"
        players={mockPlayers}
      />
    );

    const cells = screen.getAllByRole('button');
    expect(cells).toHaveLength(9);
  });

  it('should have touch targets with minimum size classes', () => {
    const { container } = render(
      <TicTacToe
        gameState={mockGameState}
        onMove={mockOnMove}
        currentUserId="user1"
        players={mockPlayers}
      />
    );

    // Check that cells have responsive size classes
    const cells = container.querySelectorAll('button');
    cells.forEach((cell) => {
      const classes = cell.className;
      // Should have mobile size (w-16 h-16 = 64px, which is > 44px minimum)
      expect(classes).toContain('w-16');
      expect(classes).toContain('h-16');
      // Should have desktop size
      expect(classes).toContain('sm:w-20');
      expect(classes).toContain('sm:h-20');
    });
  });

  it('should have responsive text sizing', () => {
    const { container } = render(
      <TicTacToe
        gameState={mockGameState}
        onMove={mockOnMove}
        currentUserId="user1"
        players={mockPlayers}
      />
    );

    const cells = container.querySelectorAll('button');
    cells.forEach((cell) => {
      const classes = cell.className;
      // Should have mobile text size (text-2xl)
      expect(classes).toContain('text-2xl');
      // Should have desktop text size (sm:text-3xl)
      expect(classes).toContain('sm:text-3xl');
    });
  });

  it('should have responsive grid gap', () => {
    const { container } = render(
      <TicTacToe
        gameState={mockGameState}
        onMove={mockOnMove}
        currentUserId="user1"
        players={mockPlayers}
      />
    );

    const grid = container.querySelector('.grid-cols-3');
    expect(grid).toBeInTheDocument();
    const classes = grid?.className || '';
    // Should have mobile gap (gap-1)
    expect(classes).toContain('gap-1');
    // Should have desktop gap (sm:gap-1.5)
    expect(classes).toContain('sm:gap-1.5');
  });

  it('should allow clicking on empty cells when it is user turn', () => {
    render(
      <TicTacToe
        gameState={mockGameState}
        onMove={mockOnMove}
        currentUserId="user1"
        players={mockPlayers}
      />
    );

    const cells = screen.getAllByRole('button');
    // Click on first cell (index 0, which is null/empty)
    fireEvent.click(cells[0]);
    
    expect(mockOnMove).toHaveBeenCalledWith({ position: 0 });
  });

  it('should not allow clicking on occupied cells', () => {
    const localMockOnMove = vi.fn();
    render(
      <TicTacToe
        gameState={mockGameState}
        onMove={localMockOnMove}
        currentUserId="user1"
        players={mockPlayers}
      />
    );

    const cells = screen.getAllByRole('button');
    // Click on second cell (index 1, which has 'X')
    fireEvent.click(cells[1]);
    
    expect(localMockOnMove).not.toHaveBeenCalled();
  });

  it('should display player names and symbols', () => {
    render(
      <TicTacToe
        gameState={mockGameState}
        onMove={mockOnMove}
        currentUserId="user1"
        players={mockPlayers}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    // Use getAllByText since X and O appear multiple times (in player labels and on board)
    expect(screen.getAllByText('X').length).toBeGreaterThan(0);
    expect(screen.getAllByText('O').length).toBeGreaterThan(0);
  });

  it('should show "Your turn" when it is current user turn', () => {
    render(
      <TicTacToe
        gameState={mockGameState}
        onMove={mockOnMove}
        currentUserId="user1"
        players={mockPlayers}
      />
    );

    expect(screen.getByText('Your turn')).toBeInTheDocument();
  });

  it('should show waiting message when it is not user turn', () => {
    render(
      <TicTacToe
        gameState={mockGameState}
        onMove={mockOnMove}
        currentUserId="user2"
        players={mockPlayers}
      />
    );

    expect(screen.getByText(/Waiting for Alice/)).toBeInTheDocument();
  });

  it('should display winner message when game is won', () => {
    const wonGameState = {
      ...mockGameState,
      winner: 'user1',
    };

    render(
      <TicTacToe
        gameState={wonGameState}
        onMove={mockOnMove}
        currentUserId="user1"
        players={mockPlayers}
      />
    );

    expect(screen.getByText('Alice wins!')).toBeInTheDocument();
  });

  it('should display draw message when board is full with no winner', () => {
    const drawGameState = {
      board: ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'],
      currentPlayerIndex: 0,
      players: ['user1', 'user2'],
      winner: null,
    };

    render(
      <TicTacToe
        gameState={drawGameState}
        onMove={mockOnMove}
        currentUserId="user1"
        players={mockPlayers}
      />
    );

    expect(screen.getByText('Draw!')).toBeInTheDocument();
  });

  it('should disable all cells when game is finished', () => {
    const wonGameState = {
      ...mockGameState,
      winner: 'user1',
    };

    render(
      <TicTacToe
        gameState={wonGameState}
        onMove={mockOnMove}
        currentUserId="user1"
        players={mockPlayers}
      />
    );

    const cells = screen.getAllByRole('button');
    cells.forEach((cell) => {
      expect(cell).toBeDisabled();
    });
  });
});

describe('TicTacToe Aspect Ratio and Viewport Fit', () => {
  const mockPlayers = [
    { userId: 'user1', displayName: 'Alice' },
    { userId: 'user2', displayName: 'Bob' },
  ];

  const mockGameState = {
    board: [null, null, null, null, null, null, null, null, null],
    currentPlayerIndex: 0,
    players: ['user1', 'user2'],
    winner: null,
  };

  const mockOnMove = vi.fn();

  it('should maintain square aspect ratio for cells', () => {
    const { container } = render(
      <TicTacToe
        gameState={mockGameState}
        onMove={mockOnMove}
        currentUserId="user1"
        players={mockPlayers}
      />
    );

    const cells = container.querySelectorAll('button');
    cells.forEach((cell) => {
      const classes = cell.className;
      // Width and height should match for square cells
      // Mobile: w-16 h-16
      expect(classes).toContain('w-16');
      expect(classes).toContain('h-16');
      // Desktop: sm:w-20 sm:h-20
      expect(classes).toContain('sm:w-20');
      expect(classes).toContain('sm:h-20');
    });
  });

  it('should use grid layout for proper alignment', () => {
    const { container } = render(
      <TicTacToe
        gameState={mockGameState}
        onMove={mockOnMove}
        currentUserId="user1"
        players={mockPlayers}
      />
    );

    const grid = container.querySelector('.grid-cols-3');
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain('grid');
  });

  it('should center the board container', () => {
    const { container } = render(
      <TicTacToe
        gameState={mockGameState}
        onMove={mockOnMove}
        currentUserId="user1"
        players={mockPlayers}
      />
    );

    const mainContainer = container.querySelector('.flex.flex-col.items-center');
    expect(mainContainer).toBeInTheDocument();
  });
});
