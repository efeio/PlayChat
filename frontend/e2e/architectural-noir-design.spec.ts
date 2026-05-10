import { test, expect, Page } from '@playwright/test';
import { loginUser, registerUser, generateTestUser } from './helpers/auth.helper';
import { createRoom, joinRoom } from './helpers/room.helper';

/**
 * Architectural Noir Design System Verification
 * 
 * This test suite verifies that all game boards maintain the Architectural Noir
 * design system across all screen sizes:
 * 
 * Design System Requirements (Requirement 5.6):
 * - Flat surfaces only (no gradients, no shadows)
 * - Border color: #222222
 * - Background colors: #0a0a0a (base), #111111 (surface), #1a1a1a (elevated)
 * - No box-shadow properties
 * - No gradient backgrounds
 * 
 * Test Coverage:
 * - TicTacToe game board
 * - ConnectFour game board
 * - RockPaperScissors game board
 * - Hangman game board
 * - Multiple screen sizes: mobile (375px), tablet (768px), desktop (1920px)
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

/**
 * Helper function to check if an element has flat surfaces (no gradients, no shadows)
 */
async function verifyFlatSurface(page: Page, selector: string, elementName: string) {
  const element = page.locator(selector).first();
  await expect(element).toBeVisible();

  // Get computed styles
  const styles = await element.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      boxShadow: computed.boxShadow,
      backgroundImage: computed.backgroundImage,
      background: computed.background,
    };
  });

  // Verify no box-shadow (should be 'none' or '0px 0px 0px 0px rgba(0, 0, 0, 0)')
  expect(
    styles.boxShadow === 'none' || 
    styles.boxShadow.includes('rgba(0, 0, 0, 0)') ||
    styles.boxShadow === 'rgba(0, 0, 0, 0) 0px 0px 0px 0px'
  ).toBeTruthy();

  // Verify no gradient backgrounds
  expect(styles.backgroundImage).not.toContain('gradient');
  expect(styles.background).not.toContain('gradient');
}

/**
 * Helper function to verify border color consistency
 */
async function verifyBorderColor(page: Page, selector: string, elementName: string) {
  const elements = page.locator(selector);
  const count = await elements.count();

  for (let i = 0; i < Math.min(count, 5); i++) {
    const element = elements.nth(i);
    const borderColor = await element.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return computed.borderColor || computed.borderTopColor;
    });

    // Border should be #222222 or transparent/none
    const isValidBorder = 
      borderColor === ARCHITECTURAL_NOIR_COLORS.border ||
      borderColor === 'rgba(0, 0, 0, 0)' ||
      borderColor === 'transparent' ||
      borderColor.includes('34, 34, 34'); // rgb(34, 34, 34) with any alpha

    expect(isValidBorder).toBeTruthy();
  }
}

/**
 * Helper function to verify background color consistency
 */
async function verifyBackgroundColor(page: Page, selector: string, elementName: string) {
  const elements = page.locator(selector);
  const count = await elements.count();

  for (let i = 0; i < Math.min(count, 5); i++) {
    const element = elements.nth(i);
    const bgColor = await element.evaluate((el) => {
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
      bgColor.includes('10, 10, 10') ||  // rgb(10, 10, 10)
      bgColor.includes('17, 17, 17') ||  // rgb(17, 17, 17)
      bgColor.includes('26, 26, 26') ||  // rgb(26, 26, 26)
      bgColor.includes('255, 255, 255'); // White for buttons (allowed)

    expect(isValidBackground).toBeTruthy();
  }
}

/**
 * Setup helper: Create room and start game
 */
async function setupGameRoom(page: Page, gameType: string) {
  const user = generateTestUser(`design-${gameType.toLowerCase()}`);
  await page.goto('/register');
  await registerUser(page, user);

  const roomName = `${gameType}-design-test-${Date.now()}`;
  await createRoom(page, roomName);

  // Wait for room to load
  await expect(page.locator('text=Start game').first()).toBeVisible({ timeout: 10000 });

  // Start the game
  // await page.locator('text=Start game').first().click();
  
  // Click the specific game type
  const gameLabels: Record<string, string> = {
    'TICTACTOE': 'Tic-Tac-Toe',
    'CONNECT_FOUR': 'Connect Four',
    'ROCK_PAPER_SCISSORS': 'Rock Paper Scissors',
    'HANGMAN': 'Hangman',
  };
  
  const gameLabel = gameLabels[gameType];
  if (gameLabel) {
    await page.click(`button:has-text("${gameLabel}")`);
  }

  // Wait for game to start
  await page.waitForTimeout(1000);
}

test.describe('Architectural Noir Design System - TicTacToe', () => {
  for (const size of SCREEN_SIZES) {
    test(`TicTacToe maintains design system on ${size.name} (${size.width}x${size.height})`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await setupGameRoom(page, 'TICTACTOE');

      // Verify game board is visible
      await expect(page.locator('button').filter({ hasText: /^[XO]?$/ }).first()).toBeVisible();

      // Test flat surfaces (no gradients, no shadows)
      const boardCells = page.locator('button').filter({ hasText: /^[XO]?$/ });
      const cellCount = await boardCells.count();
      
      for (let i = 0; i < Math.min(cellCount, 9); i++) {
        const cell = boardCells.nth(i);
        const styles = await cell.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            boxShadow: computed.boxShadow,
            backgroundImage: computed.backgroundImage,
          };
        });

        expect(styles.boxShadow === 'none' || styles.boxShadow.includes('rgba(0, 0, 0, 0)')).toBeTruthy();
        expect(styles.backgroundImage).not.toContain('gradient');
      }

      // Test border color consistency
      await verifyBorderColor(page, 'button', 'TicTacToe cells');

      // Test background color consistency
      await verifyBackgroundColor(page, 'button', 'TicTacToe cells');
    });
  }
});

test.describe('Architectural Noir Design System - ConnectFour', () => {
  for (const size of SCREEN_SIZES) {
    test(`ConnectFour maintains design system on ${size.name} (${size.width}x${size.height})`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await setupGameRoom(page, 'CONNECT_FOUR');

      // Verify game board is visible
      await expect(page.locator('button').first()).toBeVisible();

      // Test flat surfaces on board container
      const boardContainer = page.locator('div').filter({ has: page.locator('button') }).first();
      const containerStyles = await boardContainer.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          boxShadow: computed.boxShadow,
          backgroundImage: computed.backgroundImage,
        };
      });

      expect(containerStyles.boxShadow === 'none' || containerStyles.boxShadow.includes('rgba(0, 0, 0, 0)')).toBeTruthy();
      expect(containerStyles.backgroundImage).not.toContain('gradient');

      // Test border color consistency on cells
      await verifyBorderColor(page, 'button', 'ConnectFour cells');

      // Test background color consistency
      await verifyBackgroundColor(page, 'button', 'ConnectFour cells');
    });
  }
});

test.describe('Architectural Noir Design System - RockPaperScissors', () => {
  for (const size of SCREEN_SIZES) {
    test(`RockPaperScissors maintains design system on ${size.name} (${size.width}x${size.height})`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await setupGameRoom(page, 'ROCK_PAPER_SCISSORS');

      // Verify choice buttons are visible
      await expect(page.locator('button').filter({ hasText: /rock|paper|scissors/i }).first()).toBeVisible();

      // Test flat surfaces on choice buttons
      const choiceButtons = page.locator('button').filter({ hasText: /rock|paper|scissors/i });
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

        expect(styles.boxShadow === 'none' || styles.boxShadow.includes('rgba(0, 0, 0, 0)')).toBeTruthy();
        expect(styles.backgroundImage).not.toContain('gradient');
      }

      // Test border color consistency
      await verifyBorderColor(page, 'button', 'RPS choice buttons');

      // Test background color consistency
      await verifyBackgroundColor(page, 'button', 'RPS choice buttons');
    });
  }
});

test.describe('Architectural Noir Design System - Hangman', () => {
  for (const size of SCREEN_SIZES) {
    test(`Hangman maintains design system on ${size.name} (${size.width}x${size.height})`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await setupGameRoom(page, 'HANGMAN');

      // Verify keyboard is visible (guesser role)
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

          expect(styles.boxShadow === 'none' || styles.boxShadow.includes('rgba(0, 0, 0, 0)')).toBeTruthy();
          expect(styles.backgroundImage).not.toContain('gradient');
        }

        // Test border color consistency
        await verifyBorderColor(page, 'button', 'Hangman keyboard buttons');

        // Test background color consistency
        await verifyBackgroundColor(page, 'button', 'Hangman keyboard buttons');
      }

      // Test hangman figure container
      const figureContainer = page.locator('pre').first();
      if (await figureContainer.isVisible()) {
        const figureStyles = await figureContainer.evaluate((el) => {
          const parent = el.parentElement;
          if (!parent) return { boxShadow: 'none', backgroundImage: 'none' };
          const computed = window.getComputedStyle(parent);
          return {
            boxShadow: computed.boxShadow,
            backgroundImage: computed.backgroundImage,
          };
        });

        expect(figureStyles.boxShadow === 'none' || figureStyles.boxShadow.includes('rgba(0, 0, 0, 0)')).toBeTruthy();
        expect(figureStyles.backgroundImage).not.toContain('gradient');
      }
    });
  }
});

test.describe('Architectural Noir Design System - Cross-Game Verification', () => {
  test('All game boards use consistent border color #222222', async ({ page }) => {
    const games = ['TICTACTOE', 'CONNECT_FOUR', 'ROCK_PAPER_SCISSORS', 'HANGMAN'];
    
    for (const gameType of games) {
      await setupGameRoom(page, gameType);
      
      // Check all buttons have correct border color
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        const borderColor = await button.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return computed.borderColor || computed.borderTopColor;
        });

        const isValidBorder = 
          borderColor === ARCHITECTURAL_NOIR_COLORS.border ||
          borderColor === 'rgba(0, 0, 0, 0)' ||
          borderColor === 'transparent' ||
          borderColor.includes('34, 34, 34') ||
          borderColor.includes('255, 255, 255'); // White borders allowed for primary buttons

        expect(isValidBorder).toBeTruthy();
      }

      // Navigate back to dashboard for next game
      await page.goto('http://localhost:5173/dashboard');
      await page.waitForTimeout(500);
    }
  });

  test('All game boards use consistent background colors', async ({ page }) => {
    const games = ['TICTACTOE', 'CONNECT_FOUR', 'ROCK_PAPER_SCISSORS', 'HANGMAN'];
    
    for (const gameType of games) {
      await setupGameRoom(page, gameType);
      
      // Check all major containers have correct background colors
      const containers = page.locator('div').filter({ has: page.locator('button') });
      const count = await containers.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const container = containers.nth(i);
        const bgColor = await container.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return computed.backgroundColor;
        });

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

      // Navigate back to dashboard for next game
      await page.goto('http://localhost:5173/dashboard');
      await page.waitForTimeout(500);
    }
  });
});
