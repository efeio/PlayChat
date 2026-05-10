import { Page, expect } from '@playwright/test';

export async function createRoom(page: Page, roomName: string): Promise<string> {
  await page.goto('/dashboard');
  
  // Click the "Create Room" button to open modal
  await page.click('button:has-text("Create")');
  
  // Wait for modal to be visible
  await page.waitForSelector('input[placeholder*="Room name"]', { state: 'visible' });
  
  // Fill in room name
  await page.fill('input[placeholder*="Room name"]', roomName);
  
  // Click the "Create" button inside the modal (more specific selector)
  await page.locator('div.fixed button:has-text("Create")').click();
  
  // Wait for redirect to room page
  await page.waitForURL(/\/room\/[a-zA-Z0-9-]+/, { timeout: 5000 });
  
  // Extract room ID from URL
  const url = page.url();
  const roomId = url.split('/room/')[1];
  return roomId;
}

export async function joinRoom(page: Page, roomId: string): Promise<void> {
  await page.goto(`/room/${roomId}`);
  
  // Wait for room to load
  await page.waitForSelector('text=/Chat|No game in progress/', { timeout: 5000 });
}

export async function startGame(page: Page, gameType: 'TIC_TAC_TOE' | 'CONNECT_FOUR' | 'HANGMAN' | 'ROCK_PAPER_SCISSORS'): Promise<void> {
  const gameLabels = {
    TIC_TAC_TOE: 'Tic-Tac-Toe',
    CONNECT_FOUR: 'Connect Four',
    HANGMAN: 'Hangman',
    ROCK_PAPER_SCISSORS: 'Rock Paper Scissors',
  };
  
  const label = gameLabels[gameType];
  await page.click(`button:has-text("${label}")`);
  
  // Wait for game to start
  await page.waitForSelector('text=/Your turn|Waiting for/', { timeout: 5000 });
}

export async function waitForGameEnd(page: Page, timeout: number = 35000): Promise<void> {
  // Wait for game end message (winner or draw)
  await page.waitForSelector('text=/wins|Draw|disconnected/', { timeout });
}

export async function makeMove(page: Page, gameType: 'TIC_TAC_TOE' | 'CONNECT_FOUR'): Promise<void> {
  if (gameType === 'TIC_TAC_TOE') {
    // Click first empty cell on the board
    const cells = page.locator('.grid.grid-cols-3 button').filter({ hasNotText: /X|O/ });
    await cells.first().click();
  } else if (gameType === 'CONNECT_FOUR') {
    // Click first column
    const columns = page.locator('.grid button').filter({ has: page.locator('svg') });
    await columns.first().click();
  }
}

export async function setHangmanWord(page: Page, word: string): Promise<void> {
  // Wait for word input to appear (setter role)
  await page.waitForSelector('input[placeholder*="word"]', { timeout: 5000 });
  await page.fill('input[placeholder*="word"]', word);
  await page.click('button:has-text("Set")');
}

export async function guessHangmanLetter(page: Page, letter: string): Promise<void> {
  await page.click(`button:has-text("${letter}")`);
}
