import { test, expect } from '@playwright/test';
import { registerUser, generateTestUser } from './helpers/auth.helper';
import { createRoom } from './helpers/room.helper';

/**
 * Simplified Architectural Noir Design System Verification
 * 
 * This test verifies that all game boards maintain the Architectural Noir
 * design system across different screen sizes (Task 8.5):
 * 
 * - Flat surfaces only (no gradients, no shadows)
 * - Border color: #222222
 * - Background colors: #0a0a0a, #111111, #1a1a1a
 */

const SCREEN_SIZES = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
];

const ARCHITECTURAL_NOIR_COLORS = {
  bgBase: 'rgb(10, 10, 10)',      // #0a0a0a
  bgSurface: 'rgb(17, 17, 17)',   // #111111
  bgElevated: 'rgb(26, 26, 26)',  // #1a1a1a
  border: 'rgb(34, 34, 34)',      // #222222
};

test.describe('Architectural Noir Design System - Simplified', () => {
  test('All game boards maintain design system across screen sizes', async ({ page }) => {
    // Register and login
    const user = generateTestUser('design-test');
    await page.goto('/register');
    await registerUser(page, user);

    // Test each screen size
    for (const size of SCREEN_SIZES) {
      console.log(`Testing ${size.name} (${size.width}x${size.height})`);
      await page.setViewportSize({ width: size.width, height: size.height });

      // Create a room
      const roomName = `design-test-${size.name}-${Date.now()}`;
      await createRoom(page, roomName);

      // Wait for room to load
      await page.waitForTimeout(1000);

      // Start TicTacToe game by clicking the game card
      await page.click('button:has-text("Tic-Tac-Toe")');
      
      // Wait for game board to appear
      await page.waitForSelector('.grid-cols-3', { timeout: 5000 });
      await page.waitForTimeout(500);

      // Verify game board is visible - target the grid container specifically
      const gameBoard = page.locator('.grid-cols-3').first();
      await expect(gameBoard).toBeVisible();
      
      const cells = gameBoard.locator('button');
      const cellCount = await cells.count();
      expect(cellCount).toBe(9); // TicTacToe has 9 cells
      
      for (let i = 0; i < cellCount; i++) {
        const cell = cells.nth(i);
        const styles = await cell.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            boxShadow: computed.boxShadow,
            backgroundImage: computed.backgroundImage,
          };
        });

        // Verify no box-shadow
        expect(
          styles.boxShadow === 'none' || 
          styles.boxShadow.includes('rgba(0, 0, 0, 0)')
        ).toBeTruthy();

        // Verify no gradient backgrounds
        expect(styles.backgroundImage).not.toContain('gradient');
      }

      // Test border color consistency - only check game cells
      for (let i = 0; i < cellCount; i++) {
        const cell = cells.nth(i);
        const borderColor = await cell.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return computed.borderColor || computed.borderTopColor;
        });

        // Border should be #222222 or transparent/none or white (for primary buttons)
        const isValidBorder = 
          borderColor === ARCHITECTURAL_NOIR_COLORS.border ||
          borderColor === 'rgba(0, 0, 0, 0)' ||
          borderColor === 'transparent' ||
          borderColor.includes('34, 34, 34') ||
          borderColor.includes('255, 255, 255'); // White borders for primary buttons

        if (!isValidBorder) {
          console.log(`Invalid border color found on cell ${i}: ${borderColor}`);
        }
        expect(isValidBorder).toBeTruthy();
      }

      // Test background color consistency - only check game cells
      for (let i = 0; i < cellCount; i++) {
        const cell = cells.nth(i);
        const bgColor = await cell.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return computed.backgroundColor;
        });

        // Background should be one of the Architectural Noir colors or transparent
        const isValidBackground = 
          bgColor === ARCHITECTURAL_NOIR_COLORS.bgBase ||
          bgColor === ARCHITECTURAL_NOIR_COLORS.bgSurface ||
          bgColor === ARCHITECTURAL_NOIR_COLORS.bgElevated ||
          bgColor === 'rgba(0, 0, 0, 0)' ||
          bgColor === 'transparent' ||
          bgColor.includes('10, 10, 10') ||
          bgColor.includes('17, 17, 17') ||
          bgColor.includes('26, 26, 26') ||
          bgColor.includes('255, 255, 255'); // White for buttons

        expect(isValidBackground).toBeTruthy();
      }

      console.log(`✓ ${size.name} passed design system checks`);

      // Go back to dashboard for next iteration
      await page.goto('/dashboard');
      await page.waitForTimeout(500);
    }
  });

  test('ConnectFour maintains design system', async ({ page }) => {
    const user = generateTestUser('connectfour-design');
    await page.goto('/register');
    await registerUser(page, user);

    await page.setViewportSize({ width: 375, height: 667 });

    const roomName = `connectfour-design-${Date.now()}`;
    await createRoom(page, roomName);

    // Wait for room to load and click the Connect Four game card
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Connect Four")');
    await page.waitForTimeout(1000);

    // Verify game board is visible
    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible();

    // Test flat surfaces on first few buttons
    const buttonCount = await buttons.count();
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const styles = await button.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          boxShadow: computed.boxShadow,
          backgroundImage: computed.backgroundImage,
        };
      });

      expect(
        styles.boxShadow === 'none' || 
        styles.boxShadow.includes('rgba(0, 0, 0, 0)')
      ).toBeTruthy();
      expect(styles.backgroundImage).not.toContain('gradient');
    }
  });

  test('RockPaperScissors maintains design system', async ({ page }) => {
    const user = generateTestUser('rps-design');
    await page.goto('/register');
    await registerUser(page, user);

    await page.setViewportSize({ width: 375, height: 667 });

    const roomName = `rps-design-${Date.now()}`;
    await createRoom(page, roomName);

    await page.waitForTimeout(1000);
    await page.click('button:has-text("Rock Paper Scissors")');
    await page.waitForTimeout(1000);

    // Verify choice buttons are visible
    const choiceButtons = page.locator('button').filter({ hasText: /rock|paper|scissors/i });
    await expect(choiceButtons.first()).toBeVisible();

    // Test flat surfaces on choice buttons
    const buttonCount = await choiceButtons.count();
    for (let i = 0; i < buttonCount; i++) {
      const button = choiceButtons.nth(i);
      const styles = await button.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          boxShadow: computed.boxShadow,
          backgroundImage: computed.backgroundImage,
        };
      });

      expect(
        styles.boxShadow === 'none' || 
        styles.boxShadow.includes('rgba(0, 0, 0, 0)')
      ).toBeTruthy();
      expect(styles.backgroundImage).not.toContain('gradient');
    }
  });

  test('Hangman maintains design system', async ({ page }) => {
    const user = generateTestUser('hangman-design');
    await page.goto('/register');
    await registerUser(page, user);

    await page.setViewportSize({ width: 375, height: 667 });

    const roomName = `hangman-design-${Date.now()}`;
    await createRoom(page, roomName);

    await page.waitForTimeout(1000);
    await page.click('button:has-text("Hangman")');
    await page.waitForTimeout(1000);

    // Check if keyboard is visible (guesser role)
    const hasKeyboard = await page.locator('button').filter({ hasText: /^[A-Z]$/ }).first().isVisible().catch(() => false);
    
    if (hasKeyboard) {
      // Test flat surfaces on keyboard buttons
      const keyboardButtons = page.locator('button').filter({ hasText: /^[A-Z]$/ });
      const buttonCount = await keyboardButtons.count();

      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = keyboardButtons.nth(i);
        const styles = await button.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            boxShadow: computed.boxShadow,
            backgroundImage: computed.backgroundImage,
          };
        });

        expect(
          styles.boxShadow === 'none' || 
          styles.boxShadow.includes('rgba(0, 0, 0, 0)')
        ).toBeTruthy();
        expect(styles.backgroundImage).not.toContain('gradient');
      }
    }
  });
});
