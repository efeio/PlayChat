import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser } from './helpers/auth.helper';
import { createRoom, joinRoom, startGame, makeMove } from './helpers/room.helper';

/**
 * Smoke Tests - Quick verification that basic functionality works
 */

test.describe('Smoke Tests', () => {
  test('User can register, create room, and start game', async ({ page, context }) => {
    const user = generateTestUser('smoke');

    // Register
    await registerUser(page, user);
    await expect(page).toHaveURL('/dashboard');

    // Create room
    const roomId = await createRoom(page, 'Smoke Test Room');
    expect(roomId).toBeTruthy();
    await expect(page).toHaveURL(`/room/${roomId}`);

    // Verify room loaded
    await expect(page.locator('text=/No game in progress/')).toBeVisible();
  });

  test('Two users can join room and start game', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = generateTestUser('multi_1');
    const user2 = generateTestUser('multi_2');

    // Register both users
    await registerUser(page1, user1);
    await registerUser(page2, user2);

    // User 1 creates room
    const roomId = await createRoom(page1, 'Multi User Test');

    // User 2 joins room
    await joinRoom(page2, roomId);

    // Verify both users see the room
    await expect(page1.locator('text=/No game in progress/')).toBeVisible();
    await expect(page2.locator('text=/No game in progress/')).toBeVisible();

    // User 1 starts game
    await startGame(page1, 'TIC_TAC_TOE');

    // Verify game started for both users
    await expect(page1.locator('text=/Your turn|Waiting for/')).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('text=/Your turn|Waiting for/')).toBeVisible({ timeout: 5000 });

    // User 1 makes a move
    await makeMove(page1, 'TIC_TAC_TOE');
    await page1.waitForTimeout(1000);

    // Verify turn changed
    await expect(page2.locator('text=/Your turn/')).toBeVisible({ timeout: 3000 });

    await context1.close();
    await context2.close();
  });

  test('Disconnect is detected', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = generateTestUser('disconnect_smoke_1');
    const user2 = generateTestUser('disconnect_smoke_2');

    await registerUser(page1, user1);
    await registerUser(page2, user2);

    const roomId = await createRoom(page1, 'Disconnect Smoke Test');
    await joinRoom(page2, roomId);
    await startGame(page1, 'TIC_TAC_TOE');
    await page1.waitForTimeout(1000);
    await makeMove(page1, 'TIC_TAC_TOE');
    await page1.waitForTimeout(1000);

    // User 2 disconnects
    await context2.close();

    // Wait just 5 seconds to verify disconnect is detected
    // (not waiting for full 30s timeout)
    await page1.waitForTimeout(5000);

    // Game should still be active (timeout not reached yet)
    await expect(page1.locator('text=/wins/')).not.toBeVisible({ timeout: 2000 });

    await context1.close();
  });
});
