import { test, expect, Page, BrowserContext } from '@playwright/test';
import { generateTestUser, registerUser } from './helpers/auth.helper';
import { createRoom, joinRoom, startGame, makeMove } from './helpers/room.helper';

/**
 * E2E Tests for Spectator Disconnect
 * 
 * Verifies that spectator disconnects do NOT trigger the 30-second timeout
 */

test.describe('Spectator Disconnect Verification', () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let context3: BrowserContext;
  let page1: Page;
  let page2: Page;
  let page3: Page;
  let user1: ReturnType<typeof generateTestUser>;
  let user2: ReturnType<typeof generateTestUser>;
  let user3: ReturnType<typeof generateTestUser>;
  let roomId: string;

  test.beforeEach(async ({ browser }) => {
    context1 = await browser.newContext();
    context2 = await browser.newContext();
    context3 = await browser.newContext();
    page1 = await context1.newPage();
    page2 = await context2.newPage();
    page3 = await context3.newPage();

    user1 = generateTestUser('spectator_1');
    user2 = generateTestUser('spectator_2');
    user3 = generateTestUser('spectator_3');

    await registerUser(page1, user1);
    await registerUser(page2, user2);
    await registerUser(page3, user3);
  });

  test.afterEach(async () => {
    await context1.close();
    await context2.close();
    await context3.close();
  });

  test('Spectator Disconnect Does Not Trigger Timeout', async () => {
    // User 1 creates a room
    roomId = await createRoom(page1, 'Spectator Test Room');

    // User 2 joins as player
    await joinRoom(page2, roomId);

    // User 3 joins as spectator (third member becomes spectator)
    await joinRoom(page3, roomId);

    // User 1 starts a game
    await startGame(page1, 'TIC_TAC_TOE');
    await page1.waitForTimeout(1000);

    // Verify game started for players
    await expect(page1.locator('text=/Your turn|Waiting for/')).toBeVisible();
    await expect(page2.locator('text=/Your turn|Waiting for/')).toBeVisible();

    // User 1 makes a move
    await makeMove(page1, 'TIC_TAC_TOE');
    await page1.waitForTimeout(1000);

    // User 3 (spectator) disconnects
    await context3.close();

    // Wait 31 seconds (past the timeout threshold)
    await page1.waitForTimeout(31000);

    // Verify game is still active (no winner declared)
    await expect(page1.locator('text=/wins/')).not.toBeVisible({ timeout: 2000 });
    await expect(page2.locator('text=/wins/')).not.toBeVisible({ timeout: 2000 });

    // Verify players can still make moves
    await makeMove(page2, 'TIC_TAC_TOE');
    await page2.waitForTimeout(1000);

    // Verify move was successful
    await expect(page1.locator('text=/Your turn|Waiting for/')).toBeVisible();
  });

  test('Player Disconnect Triggers Timeout Even With Spectators', async () => {
    // User 1 creates a room
    roomId = await createRoom(page1, 'Player Disconnect With Spectator');

    // User 2 joins as player
    await joinRoom(page2, roomId);

    // User 3 joins as spectator
    await joinRoom(page3, roomId);

    // User 1 starts a game
    await startGame(page1, 'TIC_TAC_TOE');
    await page1.waitForTimeout(1000);
    await makeMove(page1, 'TIC_TAC_TOE');

    // User 2 (player) disconnects
    const startTime = Date.now();
    await context2.close();

    // Wait for game to end
    await page1.waitForSelector('text=/wins/', { timeout: 35000 });

    const elapsedTime = Date.now() - startTime;

    // Verify timeout was approximately 30 seconds
    expect(elapsedTime).toBeGreaterThanOrEqual(28000);
    expect(elapsedTime).toBeLessThanOrEqual(32000);

    // Verify User 1 is declared winner
    await expect(page1.locator(`text=/${user1.displayName} wins/`)).toBeVisible();

    // Spectator should also see the game end
    await expect(page3.locator('text=/wins/')).toBeVisible();
  });
});
