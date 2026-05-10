import { test, expect, Page, BrowserContext } from '@playwright/test';
import { generateTestUser, registerUser, loginUser } from './helpers/auth.helper';
import { createRoom, joinRoom, startGame, setHangmanWord, guessHangmanLetter, waitForGameEnd } from './helpers/room.helper';

/**
 * E2E Tests for Hangman Role-Based Disconnect Timeout
 * 
 * Verifies disconnect timeout works correctly with role-based games (Hangman)
 */

test.describe('Hangman Disconnect Timeout', () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;
  let user1: ReturnType<typeof generateTestUser>;
  let user2: ReturnType<typeof generateTestUser>;
  let roomId: string;

  test.beforeEach(async ({ browser }) => {
    context1 = await browser.newContext();
    context2 = await browser.newContext();
    page1 = await context1.newPage();
    page2 = await context2.newPage();

    user1 = generateTestUser('hangman_1');
    user2 = generateTestUser('hangman_2');

    await registerUser(page1, user1);
    await registerUser(page2, user2);
  });

  test.afterEach(async () => {
    await context1.close();
    await context2.close();
  });

  test('Guesser Disconnects - Setter Wins', async () => {
    // User 1 creates a room (becomes Word Setter)
    roomId = await createRoom(page1, 'Hangman Disconnect Test');

    // User 2 joins the room (becomes Word Guesser)
    await joinRoom(page2, roomId);

    // User 1 starts Hangman game
    await startGame(page1, 'HANGMAN');

    // Wait for role assignment
    await page1.waitForTimeout(2000);

    // Verify roles are displayed
    await expect(page1.locator('text=/Word Setter/')).toBeVisible();
    await expect(page2.locator('text=/Word Guesser/')).toBeVisible();

    // User 2 (Guesser) makes one guess
    await guessHangmanLetter(page2, 'A');
    await page2.waitForTimeout(1000);

    // User 2 (Guesser) disconnects
    const startTime = Date.now();
    await context2.close();

    // User 1 (Setter) should win after 30 seconds
    await waitForGameEnd(page1, 35000);

    const elapsedTime = Date.now() - startTime;

    // Verify timeout was approximately 30 seconds
    expect(elapsedTime).toBeGreaterThanOrEqual(28000);
    expect(elapsedTime).toBeLessThanOrEqual(32000);

    // Verify User 1 (Setter) is declared winner
    await expect(page1.locator(`text=/${user1.displayName} wins/`)).toBeVisible();
    await expect(page1.locator('text=/disconnected/').first()).toBeVisible();
  });

  test('Setter Disconnects - Guesser Wins', async () => {
    // User 1 creates a room (becomes Word Setter)
    roomId = await createRoom(page1, 'Hangman Setter Disconnect');

    // User 2 joins the room (becomes Word Guesser)
    await joinRoom(page2, roomId);

    // User 1 starts Hangman game
    await startGame(page1, 'HANGMAN');
    await page1.waitForTimeout(2000);

    // User 2 (Guesser) makes one guess
    await guessHangmanLetter(page2, 'E');
    await page2.waitForTimeout(1000);

    // User 1 (Setter) disconnects
    const startTime = Date.now();
    await context1.close();

    // User 2 (Guesser) should win after 30 seconds
    await waitForGameEnd(page2, 35000);

    const elapsedTime = Date.now() - startTime;

    // Verify timeout was approximately 30 seconds
    expect(elapsedTime).toBeGreaterThanOrEqual(28000);
    expect(elapsedTime).toBeLessThanOrEqual(32000);

    // Verify User 2 (Guesser) is declared winner
    await expect(page2.locator(`text=/${user2.displayName} wins/`)).toBeVisible();
    await expect(page2.locator('text=/disconnected/').first()).toBeVisible();
  });

  test('Guesser Reconnects Before Timeout', async () => {
    // User 1 creates a room (becomes Word Setter)
    roomId = await createRoom(page1, 'Hangman Reconnect Test');

    // User 2 joins the room (becomes Word Guesser)
    await joinRoom(page2, roomId);

    // User 1 starts Hangman game
    await startGame(page1, 'HANGMAN');
    await page1.waitForTimeout(2000);

    // User 2 (Guesser) makes one guess
    await guessHangmanLetter(page2, 'R');
    await page2.waitForTimeout(1000);

    // User 2 (Guesser) disconnects
    await context2.close();

    // Wait 15 seconds (half the timeout)
    await page1.waitForTimeout(15000);

    // User 2 reconnects
    context2 = await page1.context().browser()!.newContext();
    page2 = await context2.newPage();
    await loginUser(page2, user2.email, user2.password);
    await joinRoom(page2, roomId);
    await page2.waitForTimeout(2000);

    // Verify game is still active
    await expect(page1.locator('text=/wins/')).not.toBeVisible({ timeout: 5000 });
    await expect(page2.locator('text=/Word Guesser/')).toBeVisible();

    // User 2 should be able to continue guessing
    await guessHangmanLetter(page2, 'E');
    await page2.waitForTimeout(1000);

    // Verify guess was successful
    await expect(page2.locator('button:has-text("E")').first()).toHaveClass(/bg-accent-green/);
  });
});
