# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Smoke Tests >> Two users can join room and start game
- Location: e2e/smoke.spec.ts:26:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=/No game in progress/')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=/No game in progress/')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e6]
      - generic [ref=e8]: PlayChat
    - navigation [ref=e9]:
      - link "Dashboard" [ref=e10] [cursor=pointer]:
        - /url: /dashboard
        - img [ref=e11]
        - generic [ref=e16]: Dashboard
    - generic [ref=e18]:
      - generic [ref=e19]: T
      - generic [ref=e20]:
        - paragraph [ref=e21]: Test User multi_1
        - paragraph [ref=e22]: "@test_user_multi_1_1778181942941"
      - button "Logout" [ref=e23] [cursor=pointer]:
        - img [ref=e24]
  - generic [ref=e27]:
    - generic [ref=e28]:
      - generic [ref=e29]:
        - button [ref=e30] [cursor=pointer]:
          - img [ref=e31]
        - generic [ref=e33]:
          - heading "Multi User Test" [level=2] [ref=e34]
          - paragraph [ref=e35]: 2 members
      - generic [ref=e37]:
        - generic "Test User multi_1" [ref=e38]: T
        - generic "Test User multi_2" [ref=e39]: T
    - generic [ref=e40]:
      - generic [ref=e42]:
        - generic [ref=e43]:
          - paragraph [ref=e44]: No game in progress
          - paragraph [ref=e45]: Choose a game to start
        - generic [ref=e46]:
          - button "Tic-Tac-Toe Start game" [ref=e47] [cursor=pointer]:
            - paragraph [ref=e48]: Tic-Tac-Toe
            - paragraph [ref=e49]: Start game
          - button "Connect Four Start game" [ref=e50] [cursor=pointer]:
            - paragraph [ref=e51]: Connect Four
            - paragraph [ref=e52]: Start game
          - button "Rock Paper Scissors Start game" [ref=e53] [cursor=pointer]:
            - paragraph [ref=e54]: Rock Paper Scissors
            - paragraph [ref=e55]: Start game
          - button "Hangman Start game" [ref=e56] [cursor=pointer]:
            - paragraph [ref=e57]: Hangman
            - paragraph [ref=e58]: Start game
      - generic [ref=e60]:
        - generic [ref=e62]: Chat
        - paragraph [ref=e64]: No messages yet. Say something!
        - generic [ref=e66]:
          - textbox "Type a message..." [ref=e67]
          - button "Send" [disabled] [ref=e68]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { generateTestUser, registerUser } from './helpers/auth.helper';
  3  | import { createRoom, joinRoom, startGame, makeMove } from './helpers/room.helper';
  4  | 
  5  | /**
  6  |  * Smoke Tests - Quick verification that basic functionality works
  7  |  */
  8  | 
  9  | test.describe('Smoke Tests', () => {
  10 |   test('User can register, create room, and start game', async ({ page, context }) => {
  11 |     const user = generateTestUser('smoke');
  12 | 
  13 |     // Register
  14 |     await registerUser(page, user);
  15 |     await expect(page).toHaveURL('/dashboard');
  16 | 
  17 |     // Create room
  18 |     const roomId = await createRoom(page, 'Smoke Test Room');
  19 |     expect(roomId).toBeTruthy();
  20 |     await expect(page).toHaveURL(`/room/${roomId}`);
  21 | 
  22 |     // Verify room loaded
  23 |     await expect(page.locator('text=/No game in progress/')).toBeVisible();
  24 |   });
  25 | 
  26 |   test('Two users can join room and start game', async ({ browser }) => {
  27 |     const context1 = await browser.newContext();
  28 |     const context2 = await browser.newContext();
  29 |     const page1 = await context1.newPage();
  30 |     const page2 = await context2.newPage();
  31 | 
  32 |     const user1 = generateTestUser('multi_1');
  33 |     const user2 = generateTestUser('multi_2');
  34 | 
  35 |     // Register both users
  36 |     await registerUser(page1, user1);
  37 |     await registerUser(page2, user2);
  38 | 
  39 |     // User 1 creates room
  40 |     const roomId = await createRoom(page1, 'Multi User Test');
  41 | 
  42 |     // User 2 joins room
  43 |     await joinRoom(page2, roomId);
  44 | 
  45 |     // Verify both users see the room
  46 |     await expect(page1.locator('text=/No game in progress/')).toBeVisible();
> 47 |     await expect(page2.locator('text=/No game in progress/')).toBeVisible();
     |                                                               ^ Error: expect(locator).toBeVisible() failed
  48 | 
  49 |     // User 1 starts game
  50 |     await startGame(page1, 'TIC_TAC_TOE');
  51 | 
  52 |     // Verify game started for both users
  53 |     await expect(page1.locator('text=/Your turn|Waiting for/')).toBeVisible({ timeout: 5000 });
  54 |     await expect(page2.locator('text=/Your turn|Waiting for/')).toBeVisible({ timeout: 5000 });
  55 | 
  56 |     // User 1 makes a move
  57 |     await makeMove(page1, 'TIC_TAC_TOE');
  58 |     await page1.waitForTimeout(1000);
  59 | 
  60 |     // Verify turn changed
  61 |     await expect(page2.locator('text=/Your turn/')).toBeVisible({ timeout: 3000 });
  62 | 
  63 |     await context1.close();
  64 |     await context2.close();
  65 |   });
  66 | 
  67 |   test('Disconnect is detected', async ({ browser }) => {
  68 |     const context1 = await browser.newContext();
  69 |     const context2 = await browser.newContext();
  70 |     const page1 = await context1.newPage();
  71 |     const page2 = await context2.newPage();
  72 | 
  73 |     const user1 = generateTestUser('disconnect_smoke_1');
  74 |     const user2 = generateTestUser('disconnect_smoke_2');
  75 | 
  76 |     await registerUser(page1, user1);
  77 |     await registerUser(page2, user2);
  78 | 
  79 |     const roomId = await createRoom(page1, 'Disconnect Smoke Test');
  80 |     await joinRoom(page2, roomId);
  81 |     await startGame(page1, 'TIC_TAC_TOE');
  82 |     await page1.waitForTimeout(1000);
  83 |     await makeMove(page1, 'TIC_TAC_TOE');
  84 |     await page1.waitForTimeout(1000);
  85 | 
  86 |     // User 2 disconnects
  87 |     await context2.close();
  88 | 
  89 |     // Wait just 5 seconds to verify disconnect is detected
  90 |     // (not waiting for full 30s timeout)
  91 |     await page1.waitForTimeout(5000);
  92 | 
  93 |     // Game should still be active (timeout not reached yet)
  94 |     await expect(page1.locator('text=/wins/')).not.toBeVisible({ timeout: 2000 });
  95 | 
  96 |     await context1.close();
  97 |   });
  98 | });
  99 | 
```