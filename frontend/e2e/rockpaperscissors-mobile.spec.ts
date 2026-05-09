import { test, expect } from '@playwright/test';
import { loginUser, createTestUser } from './helpers/auth.helper';
import { createRoom, joinRoom } from './helpers/room.helper';

test.describe('RockPaperScissors Mobile Responsiveness', () => {
  test('should be fully playable on 375px mobile viewport', async ({ page, context }) => {
    // Set mobile viewport (iPhone SE size - 375px width)
    await page.setViewportSize({ width: 375, height: 667 });

    // Create two test users
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    // Login as user1 and create a room
    await loginUser(page, user1.email, user1.password);
    const roomId = await createRoom(page, 'Mobile RPS Test');

    // Open second page for user2
    const page2 = await context.newPage();
    await page2.setViewportSize({ width: 375, height: 667 });
    await loginUser(page2, user2.email, user2.password);
    await joinRoom(page2, roomId);

    // User1 starts the game
    await page.click('button:has-text("Start Game")');
    await page.click('button:has-text("Rock Paper Scissors")');

    // Wait for game to start
    await page.waitForSelector('text=Round', { timeout: 5000 });

    // Verify choice buttons are visible
    const rockButton = page.locator('button:has-text("rock")');
    const paperButton = page.locator('button:has-text("paper")');
    const scissorsButton = page.locator('button:has-text("scissors")');

    await expect(rockButton).toBeVisible();
    await expect(paperButton).toBeVisible();
    await expect(scissorsButton).toBeVisible();

    // Verify buttons are in wrapped/vertical layout (flex-wrap)
    const buttonsContainer = page.locator('.flex.flex-wrap').first();
    await expect(buttonsContainer).toBeVisible();

    // Verify touch targets are at least 44x44 pixels (should be 80x80 on mobile: w-20 h-20)
    const rockBox = await rockButton.boundingBox();
    expect(rockBox).not.toBeNull();
    if (rockBox) {
      // Buttons should be at least 44x44 (minimum touch target)
      expect(rockBox.width).toBeGreaterThanOrEqual(44);
      expect(rockBox.height).toBeGreaterThanOrEqual(44);
      // On mobile (w-20 h-20), buttons should be 80x80
      expect(rockBox.width).toBeGreaterThanOrEqual(75); // Allow some tolerance
      expect(rockBox.height).toBeGreaterThanOrEqual(75);
    }

    const paperBox = await paperButton.boundingBox();
    expect(paperBox).not.toBeNull();
    if (paperBox) {
      expect(paperBox.width).toBeGreaterThanOrEqual(44);
      expect(paperBox.height).toBeGreaterThanOrEqual(44);
      expect(paperBox.width).toBeGreaterThanOrEqual(75);
      expect(paperBox.height).toBeGreaterThanOrEqual(75);
    }

    const scissorsBox = await scissorsButton.boundingBox();
    expect(scissorsBox).not.toBeNull();
    if (scissorsBox) {
      expect(scissorsBox.width).toBeGreaterThanOrEqual(44);
      expect(scissorsBox.height).toBeGreaterThanOrEqual(44);
      expect(scissorsBox.width).toBeGreaterThanOrEqual(75);
      expect(scissorsBox.height).toBeGreaterThanOrEqual(75);
    }

    // Verify buttons fit within viewport with proper wrapping
    if (rockBox && paperBox && scissorsBox) {
      // All buttons should be within viewport width
      expect(rockBox.x + rockBox.width).toBeLessThanOrEqual(375);
      expect(paperBox.x + paperBox.width).toBeLessThanOrEqual(375);
      expect(scissorsBox.x + scissorsBox.width).toBeLessThanOrEqual(375);
    }

    // Verify game is playable - User1 makes a choice
    await rockButton.click();
    await expect(page.locator('text=Waiting for opponent')).toBeVisible();

    // User2 makes a choice
    const rockButton2 = page2.locator('button:has-text("rock")');
    await rockButton2.click();

    // Wait for round result
    await page.waitForSelector('text=Round 2', { timeout: 5000 });

    // Verify scores are visible
    const scoresContainer = page.locator('.flex.gap-8').first();
    await expect(scoresContainer).toBeVisible();

    // Verify round indicator is visible
    await expect(page.locator('text=Round 2 of 3')).toBeVisible();
  });

  test('should scale properly from mobile to tablet viewport', async ({ page, context }) => {
    // Create test user and room
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    // Start with mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await loginUser(page, user1.email, user1.password);
    const roomId = await createRoom(page, 'Responsive RPS Test');

    const page2 = await context.newPage();
    await page2.setViewportSize({ width: 375, height: 667 });
    await loginUser(page2, user2.email, user2.password);
    await joinRoom(page2, roomId);

    // Start game
    await page.click('button:has-text("Start Game")');
    await page.click('button:has-text("Rock Paper Scissors")');
    await page.waitForSelector('text=Round', { timeout: 5000 });

    // Get mobile button size
    const rockButton = page.locator('button:has-text("rock")');
    const mobileButtonBox = await rockButton.boundingBox();
    expect(mobileButtonBox).not.toBeNull();

    // Resize to tablet viewport (768px - sm breakpoint)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // Wait for resize

    // Get tablet button size
    const tabletButtonBox = await rockButton.boundingBox();
    expect(tabletButtonBox).not.toBeNull();

    // Buttons should be larger on tablet (sm:w-24 sm:h-24 = 96px vs w-20 h-20 = 80px)
    if (mobileButtonBox && tabletButtonBox) {
      expect(tabletButtonBox.width).toBeGreaterThan(mobileButtonBox.width);
      expect(tabletButtonBox.height).toBeGreaterThan(mobileButtonBox.height);
    }
  });

  test('should maintain playability on smallest mobile viewport (320px)', async ({ page, context }) => {
    // Test on very small viewport (iPhone 5/SE in landscape)
    await page.setViewportSize({ width: 320, height: 568 });

    const user1 = await createTestUser();
    const user2 = await createTestUser();

    await loginUser(page, user1.email, user1.password);
    const roomId = await createRoom(page, 'Small Screen RPS Test');

    const page2 = await context.newPage();
    await page2.setViewportSize({ width: 320, height: 568 });
    await loginUser(page2, user2.email, user2.password);
    await joinRoom(page2, roomId);

    // Start game
    await page.click('button:has-text("Start Game")');
    await page.click('button:has-text("Rock Paper Scissors")');
    await page.waitForSelector('text=Round', { timeout: 5000 });

    // Verify buttons are still visible and usable
    const rockButton = page.locator('button:has-text("rock")');
    const paperButton = page.locator('button:has-text("paper")');
    const scissorsButton = page.locator('button:has-text("scissors")');

    await expect(rockButton).toBeVisible();
    await expect(paperButton).toBeVisible();
    await expect(scissorsButton).toBeVisible();

    // Verify buttons fit within viewport
    const rockBox = await rockButton.boundingBox();
    expect(rockBox).not.toBeNull();
    if (rockBox) {
      expect(rockBox.x + rockBox.width).toBeLessThanOrEqual(320);
    }

    // Verify game is still playable
    await paperButton.click();
    await expect(page.locator('text=Waiting for opponent')).toBeVisible();
  });

  test('should have adequate spacing between touch targets', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const user1 = await createTestUser();
    const user2 = await createTestUser();

    await loginUser(page, user1.email, user1.password);
    const roomId = await createRoom(page, 'Touch Target RPS Test');

    const page2 = await context.newPage();
    await page2.setViewportSize({ width: 375, height: 667 });
    await loginUser(page2, user2.email, user2.password);
    await joinRoom(page2, roomId);

    // Start game
    await page.click('button:has-text("Start Game")');
    await page.click('button:has-text("Rock Paper Scissors")');
    await page.waitForSelector('text=Round', { timeout: 5000 });

    // Get positions of buttons
    const rockButton = page.locator('button:has-text("rock")');
    const paperButton = page.locator('button:has-text("paper")');

    const rockBox = await rockButton.boundingBox();
    const paperBox = await paperButton.boundingBox();

    expect(rockBox).not.toBeNull();
    expect(paperBox).not.toBeNull();

    if (rockBox && paperBox) {
      // Calculate gap between buttons (horizontal or vertical depending on wrap)
      const horizontalGap = Math.abs(paperBox.x - (rockBox.x + rockBox.width));
      const verticalGap = Math.abs(paperBox.y - (rockBox.y + rockBox.height));
      
      // At least one gap should exist (either horizontal or vertical due to flex-wrap)
      // Gap should be at least 2px (gap-3 = 12px in Tailwind)
      const minGap = Math.min(horizontalGap, verticalGap);
      if (rockBox.y === paperBox.y) {
        // Same row - check horizontal gap
        expect(horizontalGap).toBeGreaterThanOrEqual(8);
      } else {
        // Different rows - check vertical gap
        expect(verticalGap).toBeGreaterThanOrEqual(8);
      }
    }
  });

  test('should display all game elements properly on mobile', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const user1 = await createTestUser();
    const user2 = await createTestUser();

    await loginUser(page, user1.email, user1.password);
    const roomId = await createRoom(page, 'Full UI RPS Test');

    const page2 = await context.newPage();
    await page2.setViewportSize({ width: 375, height: 667 });
    await loginUser(page2, user2.email, user2.password);
    await joinRoom(page2, roomId);

    // Start game
    await page.click('button:has-text("Start Game")');
    await page.click('button:has-text("Rock Paper Scissors")');
    await page.waitForSelector('text=Round', { timeout: 5000 });

    // Verify all UI elements are visible and properly positioned
    // 1. Round indicator
    await expect(page.locator('text=Round 1 of 3')).toBeVisible();

    // 2. Scores
    const scoresContainer = page.locator('.flex.gap-8').first();
    await expect(scoresContainer).toBeVisible();

    // 3. Choice buttons
    await expect(page.locator('button:has-text("rock")')).toBeVisible();
    await expect(page.locator('button:has-text("paper")')).toBeVisible();
    await expect(page.locator('button:has-text("scissors")')).toBeVisible();

    // 4. Icons are visible
    await expect(page.locator('text=✊')).toBeVisible();
    await expect(page.locator('text=✋')).toBeVisible();
    await expect(page.locator('text=✌️')).toBeVisible();

    // Make a move and verify waiting state
    await page.locator('button:has-text("rock")').click();
    await expect(page.locator('text=Waiting for opponent')).toBeVisible();

    // Complete round
    await page2.locator('button:has-text("scissors")').click();

    // Verify last round result is visible
    await page.waitForSelector('text=Round 2', { timeout: 5000 });
    // User1 (rock) beats User2 (scissors)
    await expect(page.locator('.text-text-muted.text-xs.italic')).toBeVisible();
  });
});
