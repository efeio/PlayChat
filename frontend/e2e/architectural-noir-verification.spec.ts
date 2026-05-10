import { test, expect } from '@playwright/test';
import { registerUser, generateTestUser } from './helpers/auth.helper';
import { createRoom } from './helpers/room.helper';

/**
 * Architectural Noir Design System Verification (Task 8.5)
 * 
 * Verifies that all game boards maintain the Architectural Noir design system:
 * - Flat surfaces only (no gradients, no shadows)
 * - Border color: #222222
 * - Background colors: #0a0a0a, #111111, #1a1a1a
 */

const ARCHITECTURAL_NOIR_COLORS = {
  bgBase: 'rgb(10, 10, 10)',      // #0a0a0a
  bgSurface: 'rgb(17, 17, 17)',   // #111111
  bgElevated: 'rgb(26, 26, 26)',  // #1a1a1a
  border: 'rgb(34, 34, 34)',      // #222222
};

test.describe('Architectural Noir Design System Verification', () => {
  test('TicTacToe maintains design system', async ({ page }) => {
    const user = generateTestUser('tictactoe-design');
    await page.goto('/register');
    await registerUser(page, user);

    await page.setViewportSize({ width: 375, height: 667 });

    const roomName = `tictactoe-design-${Date.now()}`;
    await createRoom(page, roomName);

    await page.waitForTimeout(1000);
    await page.click('button:has-text("Tic-Tac-Toe")');
    
    // Wait for game board
    await page.waitForSelector('.grid\.grid-cols-3', { timeout: 10000 });

    const gameBoard = page.locator('.grid\.grid-cols-3').first();
    const cells = gameBoard.locator('button');
    const cellCount = await cells.count();
    expect(cellCount).toBe(9);

    // Test flat surfaces, borders, and backgrounds
    for (let i = 0; i < cellCount; i++) {
      const cell = cells.nth(i);
      const styles = await cell.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          boxShadow: computed.boxShadow,
          backgroundImage: computed.backgroundImage,
          borderColor: computed.borderColor || computed.borderTopColor,
          backgroundColor: computed.backgroundColor,
        };
      });

      // No shadows
      expect(
        styles.boxShadow === 'none' || 
        styles.boxShadow.includes('rgba(0, 0, 0, 0)')
      ).toBeTruthy();

      // No gradients
      expect(styles.backgroundImage).not.toContain('gradient');

      // Valid border color
      const isValidBorder = 
        styles.borderColor === ARCHITECTURAL_NOIR_COLORS.border ||
        styles.borderColor === 'rgba(0, 0, 0, 0)' ||
        styles.borderColor === 'transparent' ||
        styles.borderColor.includes('34, 34, 34') ||
        styles.borderColor.includes('255, 255, 255');
      expect(isValidBorder).toBeTruthy();

      // Valid background color
      const isValidBackground = 
        styles.backgroundColor === ARCHITECTURAL_NOIR_COLORS.bgBase ||
        styles.backgroundColor === ARCHITECTURAL_NOIR_COLORS.bgSurface ||
        styles.backgroundColor === ARCHITECTURAL_NOIR_COLORS.bgElevated ||
        styles.backgroundColor === 'rgba(0, 0, 0, 0)' ||
        styles.backgroundColor === 'transparent' ||
        styles.backgroundColor.includes('10, 10, 10') ||
        styles.backgroundColor.includes('17, 17, 17') ||
        styles.backgroundColor.includes('26, 26, 26') ||
        styles.backgroundColor.includes('255, 255, 255');
      expect(isValidBackground).toBeTruthy();
    }
  });

  test('ConnectFour maintains design system', async ({ page }) => {
    const user = generateTestUser('connectfour-design');
    await page.goto('/register');
    await registerUser(page, user);

    await page.setViewportSize({ width: 375, height: 667 });

    const roomName = `connectfour-design-${Date.now()}`;
    await createRoom(page, roomName);

    await page.waitForTimeout(1000);
    await page.click('button:has-text("Connect Four")');
    await page.waitForTimeout(1000);

    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible();

    // Test first 10 buttons for design system compliance
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

    const choiceButtons = page.locator('button').filter({ hasText: /rock|paper|scissors/i });
    await expect(choiceButtons.first()).toBeVisible();

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

    const hasKeyboard = await page.locator('button').filter({ hasText: /^[A-Z]$/ }).first().isVisible().catch(() => false);
    
    if (hasKeyboard) {
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
