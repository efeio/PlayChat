import { test, expect } from '@playwright/test';
import { loginUser, createTestUser } from './helpers/auth.helper';
import { createRoom, joinRoom } from './helpers/room.helper';

test.describe('Hangman Mobile Responsiveness', () => {
  test('should be fully playable on 375px mobile viewport', async ({ page, context }) => {
    // Set mobile viewport (iPhone SE size - 375px width)
    await page.setViewportSize({ width: 375, height: 667 });

    // Create two test users
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    // Login as user1 and create a room
    await loginUser(page, user1.username, user1.password);
    const roomId = await createRoom(page, 'Mobile Hangman Test');

    // Open second page for user2
    const page2 = await context.newPage();
    await page2.setViewportSize({ width: 375, height: 667 });
    await loginUser(page2, user2.username, user2.password);
    await joinRoom(page2, roomId);

    // User1 starts the game
    await page.click('button:has-text("Start Game")');
    await page.click('button:has-text("Hangman")');

    // Wait for game to start - user2 is the guesser
    await page2.waitForSelector('text=Guess the word!', { timeout: 5000 });

    // Verify stacked layout: word, keyboard, and hangman graphic should be visible
    const hangmanFigure = page2.locator('pre.font-mono');
    await expect(hangmanFigure).toBeVisible();

    const wordDisplay = page2.locator('.tracking-\\[0\\.2em\\]');
    await expect(wordDisplay).toBeVisible();

    // Verify hangman figure fits in viewport
    const figureBox = await hangmanFigure.boundingBox();
    expect(figureBox).not.toBeNull();
    if (figureBox) {
      // Figure should fit within 375px width
      expect(figureBox.width).toBeLessThan(375);
    }

    // Verify keyboard buttons are at least 44x44 pixels (Requirement 5.5)
    const keyboardButtons = page2.locator('button').filter({ hasText: /^[A-Z]$/ });
    const buttonCount = await keyboardButtons.count();
    expect(buttonCount).toBe(26); // All alphabet letters

    // Check first button dimensions
    const firstButton = keyboardButtons.first();
    const buttonBox = await firstButton.boundingBox();
    expect(buttonBox).not.toBeNull();
    if (buttonBox) {
      // Buttons must be at least 44x44 (minimum touch target per Requirement 5.5)
      expect(buttonBox.width).toBeGreaterThanOrEqual(44);
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    }

    // Verify keyboard is in stacked layout (wrapped)
    const keyboardContainer = page2.locator('.flex-wrap').first();
    await expect(keyboardContainer).toBeVisible();

    // Verify buttons are clickable and game is playable
    // User2 (guesser) makes a guess
    await keyboardButtons.first().click();

    // Verify the button becomes disabled after click
    await expect(keyboardButtons.first()).toBeDisabled();

    // Verify word guess input is visible and usable
    const wordGuessInput = page2.locator('input[placeholder="Guess the word..."]');
    await expect(wordGuessInput).toBeVisible();

    const inputBox = await wordGuessInput.boundingBox();
    expect(inputBox).not.toBeNull();
    if (inputBox) {
      // Input should fit within viewport
      expect(inputBox.width).toBeLessThan(375);
    }

    // Verify guess button is visible and has adequate touch target
    const guessButton = page2.locator('button:has-text("Guess")');
    await expect(guessButton).toBeVisible();

    const guessButtonBox = await guessButton.boundingBox();
    expect(guessButtonBox).not.toBeNull();
    if (guessButtonBox) {
      // Button should be at least 44px tall
      expect(guessButtonBox.height).toBeGreaterThanOrEqual(44);
    }

    // Verify roles are displayed
    await expect(page2.locator('text=Word Setter:')).toBeVisible();
    await expect(page2.locator('text=Word Guesser:')).toBeVisible();

    // Verify status message is visible
    await expect(page2.locator('text=Guess the word!')).toBeVisible();
  });

  test('should display word, keyboard, and hangman graphic in stacked layout', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const user1 = await createTestUser();
    const user2 = await createTestUser();

    await loginUser(page, user1.username, user1.password);
    const roomId = await createRoom(page, 'Stacked Layout Test');

    const page2 = await context.newPage();
    await page2.setViewportSize({ width: 375, height: 667 });
    await loginUser(page2, user2.username, user2.password);
    await joinRoom(page2, roomId);

    // Start game
    await page.click('button:has-text("Start Game")');
    await page.click('button:has-text("Hangman")');
    await page2.waitForSelector('text=Guess the word!', { timeout: 5000 });

    // Get positions of key elements to verify stacked layout
    const hangmanFigure = page2.locator('pre.font-mono');
    const wordDisplay = page2.locator('.tracking-\\[0\\.2em\\]');
    const keyboard = page2.locator('.flex-wrap').first();

    const figureBox = await hangmanFigure.boundingBox();
    const wordBox = await wordDisplay.boundingBox();
    const keyboardBox = await keyboard.boundingBox();

    expect(figureBox).not.toBeNull();
    expect(wordBox).not.toBeNull();
    expect(keyboardBox).not.toBeNull();

    if (figureBox && wordBox && keyboardBox) {
      // Verify vertical stacking: hangman figure should be above word display
      expect(figureBox.y).toBeLessThan(wordBox.y);
      // Word display should be above keyboard
      expect(wordBox.y).toBeLessThan(keyboardBox.y);

      // All elements should be roughly centered (x position similar)
      const figureCenterX = figureBox.x + figureBox.width / 2;
      const wordCenterX = wordBox.x + wordBox.width / 2;
      const keyboardCenterX = keyboardBox.x + keyboardBox.width / 2;

      // Allow 50px tolerance for centering
      expect(Math.abs(figureCenterX - wordCenterX)).toBeLessThan(50);
      expect(Math.abs(wordCenterX - keyboardCenterX)).toBeLessThan(50);
    }
  });

  test('should maintain playability on smallest mobile viewport (320px)', async ({ page, context }) => {
    // Test on very small viewport
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
    await page.click('button:has-text("Hangman")');
    await page2.waitForSelector('text=Guess the word!', { timeout: 5000 });

    // Verify all elements are still visible
    await expect(page2.locator('pre.font-mono')).toBeVisible();
    await expect(page2.locator('.tracking-\\[0\\.2em\\]')).toBeVisible();

    // Verify keyboard buttons are still at least 44x44
    const keyboardButtons = page2.locator('button').filter({ hasText: /^[A-Z]$/ });
    const firstButton = keyboardButtons.first();
    const buttonBox = await firstButton.boundingBox();
    expect(buttonBox).not.toBeNull();
    if (buttonBox) {
      expect(buttonBox.width).toBeGreaterThanOrEqual(44);
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    }

    // Verify keyboard wraps properly
    const keyboard = page2.locator('.flex-wrap').first();
    const keyboardBox = await keyboard.boundingBox();
    expect(keyboardBox).not.toBeNull();
    if (keyboardBox) {
      // Keyboard should fit within 320px width
      expect(keyboardBox.width).toBeLessThan(320);
    }

    // Verify buttons are still clickable
    await keyboardButtons.nth(0).click();
    await expect(keyboardButtons.nth(0)).toBeDisabled();
  });

  test('should have adequate spacing between keyboard buttons', async ({ page, context }) => {
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
    await page.click('button:has-text("Hangman")');
    await page2.waitForSelector('text=Guess the word!', { timeout: 5000 });

    // Get positions of adjacent buttons in the same row
    const keyboardButtons = page2.locator('button').filter({ hasText: /^[A-Z]$/ });
    const button0Box = await keyboardButtons.nth(0).boundingBox();
    const button1Box = await keyboardButtons.nth(1).boundingBox();

    expect(button0Box).not.toBeNull();
    expect(button1Box).not.toBeNull();

    if (button0Box && button1Box) {
      // Check if buttons are in the same row (similar y position)
      if (Math.abs(button0Box.y - button1Box.y) < 10) {
        // Calculate horizontal gap between buttons
        const gap = button1Box.x - (button0Box.x + button0Box.width);
        // Gap should be at least 2px (gap-1.5 = 6px in Tailwind)
        expect(gap).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test('should scale properly from mobile to tablet viewport', async ({ page, context }) => {
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
    await page.click('button:has-text("Hangman")');
    await page2.waitForSelector('text=Guess the word!', { timeout: 5000 });

    // Get mobile button size
    const keyboardButtons = page2.locator('button').filter({ hasText: /^[A-Z]$/ });
    const mobileButtonBox = await keyboardButtons.first().boundingBox();
    expect(mobileButtonBox).not.toBeNull();

    // Resize to tablet viewport (768px - sm breakpoint)
    await page2.setViewportSize({ width: 768, height: 1024 });
    await page2.waitForTimeout(500); // Wait for resize

    // Get tablet button size
    const tabletButtonBox = await keyboardButtons.first().boundingBox();
    expect(tabletButtonBox).not.toBeNull();

    // Buttons should be slightly larger on tablet (sm:w-12 sm:h-12 vs w-11 h-11)
    if (mobileButtonBox && tabletButtonBox) {
      expect(tabletButtonBox.width).toBeGreaterThanOrEqual(mobileButtonBox.width);
      expect(tabletButtonBox.height).toBeGreaterThanOrEqual(mobileButtonBox.height);
    }
  });
});
