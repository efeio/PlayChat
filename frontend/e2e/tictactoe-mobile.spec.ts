import { test, expect } from '@playwright/test';
import { loginUser, createTestUser } from './helpers/auth.helper';
import { createRoom, joinRoom } from './helpers/room.helper';

test.describe('TicTacToe Mobile Responsiveness', () => {
  test('should be fully playable on 375px mobile viewport', async ({ page, context }) => {
    // Set mobile viewport (iPhone SE size - 375px width)
    await page.setViewportSize({ width: 375, height: 667 });

    // Create two test users
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    // Login as user1 and create a room
    await loginUser(page, user1.username, user1.password);
    const roomId = await createRoom(page, 'Mobile TicTacToe Test');

    // Open second page for user2
    const page2 = await context.newPage();
    await page2.setViewportSize({ width: 375, height: 667 });
    await loginUser(page2, user2.username, user2.password);
    await joinRoom(page2, roomId);

    // User1 starts the game
    await page.click('button:has-text("Start Game")');
    await page.click('button:has-text("Tic-Tac-Toe")');

    // Wait for game to start
    await page.waitForSelector('text=Your turn', { timeout: 5000 });

    // Verify board is visible and fits in viewport
    const board = page.locator('.grid-cols-3').first();
    await expect(board).toBeVisible();

    // Get board bounding box to verify it fits in viewport
    const boardBox = await board.boundingBox();
    expect(boardBox).not.toBeNull();
    if (boardBox) {
      // Board should fit within 375px width with some margin
      expect(boardBox.width).toBeLessThan(375);
      // Board should be roughly square (aspect ratio maintained)
      const aspectRatio = boardBox.width / boardBox.height;
      expect(aspectRatio).toBeGreaterThan(0.9);
      expect(aspectRatio).toBeLessThan(1.1);
    }

    // Verify touch targets are at least 44x44 pixels
    const cells = page.locator('.grid-cols-3 button');
    const cellCount = await cells.count();
    expect(cellCount).toBe(9);

    // Check first cell dimensions (should be 64x64 on mobile: w-16 h-16)
    const firstCell = cells.first();
    const cellBox = await firstCell.boundingBox();
    expect(cellBox).not.toBeNull();
    if (cellBox) {
      // Cells should be at least 44x44 (minimum touch target)
      expect(cellBox.width).toBeGreaterThanOrEqual(44);
      expect(cellBox.height).toBeGreaterThanOrEqual(44);
      // On mobile (w-16 h-16), cells should be 64x64
      expect(cellBox.width).toBeGreaterThanOrEqual(60); // Allow some tolerance
      expect(cellBox.height).toBeGreaterThanOrEqual(60);
    }

    // Verify cells are clickable and game is playable
    // User1 makes first move (X)
    await cells.nth(0).click();
    await expect(page.locator('text=Waiting for')).toBeVisible();

    // User2 makes second move (O)
    await page2.waitForSelector('text=Your turn', { timeout: 5000 });
    const cells2 = page2.locator('.grid-cols-3 button');
    await cells2.nth(1).click();

    // User1 makes third move
    await page.waitForSelector('text=Your turn', { timeout: 5000 });
    await cells.nth(2).click();

    // Verify the moves are displayed correctly
    await expect(cells.nth(0).locator('span')).toHaveText('X');
    await expect(cells.nth(1).locator('span')).toHaveText('O');
    await expect(cells.nth(2).locator('span')).toHaveText('X');

    // Verify player indicators are visible
    await expect(page.locator('text=X').first()).toBeVisible();
    await expect(page.locator('text=O').first()).toBeVisible();

    // Verify status message is visible
    const statusArea = page.locator('.text-center').first();
    await expect(statusArea).toBeVisible();
  });

  test('should scale properly from mobile to tablet viewport', async ({ page, context }) => {
    // Create test user and room
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    // Start with mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await loginUser(page, user1.username, user1.password);
    const roomId = await createRoom(page, 'Responsive Test');

    const page2 = await context.newPage();
    await page2.setViewportSize({ width: 375, height: 667 });
    await loginUser(page2, user2.username, user2.password);
    await joinRoom(page2, roomId);

    // Start game
    await page.click('button:has-text("Start Game")');
    await page.click('button:has-text("Tic-Tac-Toe")');
    await page.waitForSelector('text=Your turn', { timeout: 5000 });

    // Get mobile cell size
    const cells = page.locator('.grid-cols-3 button');
    const mobileCellBox = await cells.first().boundingBox();
    expect(mobileCellBox).not.toBeNull();

    // Resize to tablet viewport (768px - sm breakpoint)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // Wait for resize

    // Get tablet cell size
    const tabletCellBox = await cells.first().boundingBox();
    expect(tabletCellBox).not.toBeNull();

    // Cells should be larger on tablet (sm:w-20 sm:h-20 = 80px vs w-16 h-16 = 64px)
    if (mobileCellBox && tabletCellBox) {
      expect(tabletCellBox.width).toBeGreaterThan(mobileCellBox.width);
      expect(tabletCellBox.height).toBeGreaterThan(mobileCellBox.height);
    }
  });

  test('should maintain playability on smallest mobile viewport (320px)', async ({ page, context }) => {
    // Test on very small viewport (iPhone 5/SE in landscape)
    await page.setViewportSize({ width: 320, height: 568 });

    const user1 = await createTestUser();
    const user2 = await createTestUser();

    await loginUser(page, user1.username, user1.password);
    const roomId = await createRoom(page, 'Small Screen Test');

    const page2 = await context.newPage();
    await page2.setViewportSize({ width: 320, height: 568 });
    await loginUser(page2, user2.username, user2.password);
    await joinRoom(page2, roomId);

    // Start game
    await page.click('button:has-text("Start Game")');
    await page.click('button:has-text("Tic-Tac-Toe")');
    await page.waitForSelector('text=Your turn', { timeout: 5000 });

    // Verify board is still visible and usable
    const board = page.locator('.grid-cols-3').first();
    await expect(board).toBeVisible();

    const boardBox = await board.boundingBox();
    expect(boardBox).not.toBeNull();
    if (boardBox) {
      // Board should fit within 320px width
      expect(boardBox.width).toBeLessThan(320);
    }

    // Verify cells are still clickable
    const cells = page.locator('.grid-cols-3 button');
    await cells.nth(4).click(); // Click center cell
    await expect(cells.nth(4).locator('span')).toHaveText('X');
  });

  test('should have adequate spacing between touch targets', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const user1 = await createTestUser();
    const user2 = await createTestUser();

    await loginUser(page, user1.username, user1.password);
    const roomId = await createRoom(page, 'Touch Target Test');

    const page2 = await context.newPage();
    await page2.setViewportSize({ width: 375, height: 667 });
    await loginUser(page2, user2.username, user2.password);
    await joinRoom(page2, roomId);

    // Start game
    await page.click('button:has-text("Start Game")');
    await page.click('button:has-text("Tic-Tac-Toe")');
    await page.waitForSelector('text=Your turn', { timeout: 5000 });

    // Get positions of adjacent cells
    const cells = page.locator('.grid-cols-3 button');
    const cell0Box = await cells.nth(0).boundingBox();
    const cell1Box = await cells.nth(1).boundingBox();

    expect(cell0Box).not.toBeNull();
    expect(cell1Box).not.toBeNull();

    if (cell0Box && cell1Box) {
      // Calculate gap between cells
      const gap = cell1Box.x - (cell0Box.x + cell0Box.width);
      // Gap should be at least 2px (gap-1 = 4px in Tailwind)
      expect(gap).toBeGreaterThanOrEqual(2);
    }
  });
});
