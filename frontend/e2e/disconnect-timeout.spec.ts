import { test, expect, Page, BrowserContext } from '@playwright/test';
import { generateTestUser, registerUser, loginUser } from './helpers/auth.helper';
import { createRoom, joinRoom, startGame, makeMove, waitForGameEnd } from './helpers/room.helper';

/**
 * E2E Tests for Disconnect Timeout (INV-008)
 * 
 * Requirement: If a player disconnects during an active game, 
 * wait 30 seconds before declaring the other player as winner.
 */

test.describe('Disconnect Timeout Verification (INV-008)', () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;
  let user1: ReturnType<typeof generateTestUser>;
  let user2: ReturnType<typeof generateTestUser>;
  let roomId: string;

  test.beforeEach(async ({ browser }) => {
    // Create two separate browser contexts (simulating two users)
    context1 = await browser.newContext();
    context2 = await browser.newContext();
    page1 = await context1.newPage();
    page2 = await context2.newPage();

    // Generate unique test users
    user1 = generateTestUser('disconnect_1');
    user2 = generateTestUser('disconnect_2');

    // Register both users
    await registerUser(page1, user1);
    await registerUser(page2, user2);
  });

  test.afterEach(async () => {
    await context1.close();
    await context2.close();
  });

  test('Test Case 1: Basic Disconnect Timeout', async () => {
    // User 1 creates a room
    roomId = await createRoom(page1, 'Disconnect Test Room');

    // User 2 joins the room
    await joinRoom(page2, roomId);

    // User 1 starts a Tic-Tac-Toe game
    await startGame(page1, 'TIC_TAC_TOE');

    // Wait for game to start on both pages
    await page1.waitForSelector('text=/Your turn|Waiting for/', { timeout: 5000 });
    await page2.waitForSelector('text=/Your turn|Waiting for/', { timeout: 5000 });

    // User 1 makes a move
    await makeMove(page1, 'TIC_TAC_TOE');

    // Wait a moment for move to register
    await page1.waitForTimeout(1000);

    // User 2 disconnects (close context)
    const startTime = Date.now();
    await context2.close();

    // User 1 should see game end after 30 seconds
    await waitForGameEnd(page1, 35000);

    const elapsedTime = Date.now() - startTime;

    // Verify timeout was approximately 30 seconds (allow 28-32s range)
    expect(elapsedTime).toBeGreaterThanOrEqual(28000);
    expect(elapsedTime).toBeLessThanOrEqual(32000);

    // Verify User 1 is declared winner
    await expect(page1.locator('text=/wins/')).toBeVisible();
    await expect(page1.locator(`text=/${user1.displayName} wins/`)).toBeVisible();

    // Verify disconnect reason is shown
    await expect(page1.locator('text=/disconnected/')).toBeVisible();
  });

  test('Test Case 2: Reconnection Within Timeout', async () => {
    // User 1 creates a room
    roomId = await createRoom(page1, 'Reconnect Test Room');

    // User 2 joins the room
    await joinRoom(page2, roomId);

    // User 1 starts a Connect Four game
    await startGame(page1, 'CONNECT_FOUR');

    // Wait for game to start
    await page1.waitForSelector('text=/Your turn|Waiting for/', { timeout: 5000 });
    await page2.waitForSelector('text=/Your turn|Waiting for/', { timeout: 5000 });

    // User 1 makes a move
    await makeMove(page1, 'CONNECT_FOUR');
    await page1.waitForTimeout(1000);

    // User 2 disconnects
    await context2.close();

    // Wait 15 seconds (half the timeout)
    await page1.waitForTimeout(15000);

    // User 2 reconnects (create new context and login)
    context2 = await page1.context().browser()!.newContext();
    page2 = await context2.newPage();
    await loginUser(page2, user2.username, user2.password);
    await joinRoom(page2, roomId);

    // Wait a moment for reconnection to register
    await page2.waitForTimeout(2000);

    // Verify game is still active (no winner declared)
    await expect(page1.locator('text=/wins/')).not.toBeVisible({ timeout: 5000 });
    
    // Verify User 2 can still see the game
    await expect(page2.locator('text=/Your turn|Waiting for/')).toBeVisible();

    // User 2 should be able to make a move
    await makeMove(page2, 'CONNECT_FOUR');
    await page2.waitForTimeout(1000);

    // Verify move was successful
    await expect(page1.locator('text=/Your turn|Waiting for/')).toBeVisible();
  });

  test('Test Case 3: Multiple Games Disconnect', async () => {
    // Create two separate rooms with different user pairs
    const user3 = generateTestUser('disconnect_3');
    const user4 = generateTestUser('disconnect_4');

    const context3 = await page1.context().browser()!.newContext();
    const context4 = await page1.context().browser()!.newContext();
    const page3 = await context3.newPage();
    const page4 = await context4.newPage();

    await registerUser(page3, user3);
    await registerUser(page4, user4);

    // Room 1: User 1 and User 2
    const room1Id = await createRoom(page1, 'Multi Room 1');
    await joinRoom(page2, room1Id);
    await startGame(page1, 'TIC_TAC_TOE');
    await page1.waitForTimeout(1000);
    await makeMove(page1, 'TIC_TAC_TOE');

    // Room 2: User 3 and User 4
    const room2Id = await createRoom(page3, 'Multi Room 2');
    await joinRoom(page4, room2Id);
    await startGame(page3, 'TIC_TAC_TOE');
    await page3.waitForTimeout(1000);
    await makeMove(page3, 'TIC_TAC_TOE');

    // Both User 2 and User 4 disconnect
    const startTime = Date.now();
    await context2.close();
    await context4.close();

    // Both games should end after 30 seconds
    await Promise.all([
      waitForGameEnd(page1, 35000),
      waitForGameEnd(page3, 35000),
    ]);

    const elapsedTime = Date.now() - startTime;

    // Verify timeout was approximately 30 seconds
    expect(elapsedTime).toBeGreaterThanOrEqual(28000);
    expect(elapsedTime).toBeLessThanOrEqual(32000);

    // Verify both winners
    await expect(page1.locator(`text=/${user1.displayName} wins/`)).toBeVisible();
    await expect(page3.locator(`text=/${user3.displayName} wins/`)).toBeVisible();

    // Cleanup
    await context3.close();
  });

  test('Test Case 4: Disconnect Before First Move', async () => {
    // User 1 creates a room
    roomId = await createRoom(page1, 'No Move Test Room');

    // User 2 joins the room
    await joinRoom(page2, roomId);

    // User 1 starts a game
    await startGame(page1, 'TIC_TAC_TOE');

    // Wait for game to start
    await page1.waitForSelector('text=/Your turn|Waiting for/', { timeout: 5000 });
    await page2.waitForSelector('text=/Your turn|Waiting for/', { timeout: 5000 });

    // User 2 disconnects immediately (no moves made)
    const startTime = Date.now();
    await context2.close();

    // User 1 should still see game end after 30 seconds
    await waitForGameEnd(page1, 35000);

    const elapsedTime = Date.now() - startTime;

    // Verify timeout was approximately 30 seconds
    expect(elapsedTime).toBeGreaterThanOrEqual(28000);
    expect(elapsedTime).toBeLessThanOrEqual(32000);

    // Verify User 1 is declared winner
    await expect(page1.locator(`text=/${user1.displayName} wins/`)).toBeVisible();
  });

  test('Test Case 5: Both Players Disconnect', async () => {
    // User 1 creates a room
    roomId = await createRoom(page1, 'Both Disconnect Room');

    // User 2 joins the room
    await joinRoom(page2, roomId);

    // User 1 starts a game
    await startGame(page1, 'TIC_TAC_TOE');
    await page1.waitForTimeout(1000);
    await makeMove(page1, 'TIC_TAC_TOE');

    // User 1 disconnects first
    await context1.close();

    // Wait 5 seconds
    await page2.waitForTimeout(5000);

    // User 2 disconnects
    await context2.close();

    // Note: Since both users are disconnected, we can't verify the outcome
    // from the client side. This test verifies the server doesn't crash.
    // In a real scenario, we'd check server logs or database state.
  });

  test('Test Case 6: Disconnect After Game Ends', async () => {
    // User 1 creates a room
    roomId = await createRoom(page1, 'Post Game Disconnect');

    // User 2 joins the room
    await joinRoom(page2, roomId);

    // User 1 starts a game
    await startGame(page1, 'TIC_TAC_TOE');
    await page1.waitForTimeout(1000);

    // Play game to completion (User 1 wins)
    // Row 1: X, O, X
    await makeMove(page1, 'TIC_TAC_TOE'); // X at 0
    await page1.waitForTimeout(500);
    await makeMove(page2, 'TIC_TAC_TOE'); // O at 1
    await page2.waitForTimeout(500);
    await makeMove(page1, 'TIC_TAC_TOE'); // X at 2
    await page1.waitForTimeout(500);
    
    // Row 2: O, X, O
    await makeMove(page2, 'TIC_TAC_TOE'); // O at 3
    await page2.waitForTimeout(500);
    await makeMove(page1, 'TIC_TAC_TOE'); // X at 4
    await page1.waitForTimeout(500);
    await makeMove(page2, 'TIC_TAC_TOE'); // O at 5
    await page2.waitForTimeout(500);
    
    // Row 3: X wins
    await makeMove(page1, 'TIC_TAC_TOE'); // X at 6 (wins: 0, 3, 6)

    // Wait for game to end
    await waitForGameEnd(page1, 5000);
    await expect(page1.locator('text=/wins/')).toBeVisible();

    // User 2 disconnects after game ends
    await context2.close();

    // Wait 30+ seconds
    await page1.waitForTimeout(31000);

    // Verify no additional game end events (winner unchanged)
    await expect(page1.locator(`text=/${user1.displayName} wins/`)).toBeVisible();
    
    // Verify no disconnect message appears
    const disconnectMessages = await page1.locator('text=/disconnected/').count();
    expect(disconnectMessages).toBe(0);
  });

  test('Test Case 7: Disconnect During Different Game Types', async () => {
    // Test with Connect Four
    roomId = await createRoom(page1, 'Connect Four Disconnect');
    await joinRoom(page2, roomId);
    await startGame(page1, 'CONNECT_FOUR');
    await page1.waitForTimeout(1000);
    await makeMove(page1, 'CONNECT_FOUR');

    const startTime = Date.now();
    await context2.close();

    await waitForGameEnd(page1, 35000);
    const elapsedTime = Date.now() - startTime;

    expect(elapsedTime).toBeGreaterThanOrEqual(28000);
    expect(elapsedTime).toBeLessThanOrEqual(32000);
    await expect(page1.locator(`text=/${user1.displayName} wins/`)).toBeVisible();
    await expect(page1.locator('text=/disconnected/')).toBeVisible();
  });

  test('Test Case 8: Rapid Disconnect/Reconnect', async () => {
    // User 1 creates a room
    roomId = await createRoom(page1, 'Rapid Reconnect Room');

    // User 2 joins the room
    await joinRoom(page2, roomId);

    // User 1 starts a game
    await startGame(page1, 'TIC_TAC_TOE');
    await page1.waitForTimeout(1000);
    await makeMove(page1, 'TIC_TAC_TOE');

    // User 2 disconnects and reconnects rapidly (3 times)
    for (let i = 0; i < 3; i++) {
      await context2.close();
      await page1.waitForTimeout(2000);

      context2 = await page1.context().browser()!.newContext();
      page2 = await context2.newPage();
      await loginUser(page2, user2.username, user2.password);
      await joinRoom(page2, roomId);
      await page2.waitForTimeout(2000);
    }

    // Verify game is still active
    await expect(page1.locator('text=/wins/')).not.toBeVisible({ timeout: 5000 });
    await expect(page2.locator('text=/Your turn|Waiting for/')).toBeVisible();

    // User 2 should be able to make a move
    await makeMove(page2, 'TIC_TAC_TOE');
    await page2.waitForTimeout(1000);

    // Verify move was successful
    await expect(page1.locator('text=/Your turn|Waiting for/')).toBeVisible();
  });
});
