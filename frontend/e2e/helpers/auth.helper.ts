import { Page } from '@playwright/test';

export interface TestUser {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export async function registerUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/register');
  await page.fill('#register-display-name', user.displayName);
  await page.fill('#register-username', user.username);
  await page.fill('#register-email', user.email);
  await page.fill('#register-password', user.password);
  await page.fill('#register-confirm-password', user.password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

export async function loginUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

export async function getAuthToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => localStorage.getItem('token'));
}

export function generateTestUser(suffix: string): TestUser {
  const timestamp = Date.now();
  return {
    username: `test_user_${suffix}_${timestamp}`,
    email: `test_${suffix}_${timestamp}@playchat.test`,
    password: 'TestPassword123!',
    displayName: `Test User ${suffix}`,
  };
}

export async function createTestUser(): Promise<TestUser> {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);
  const user: TestUser = {
    username: `test_${timestamp}_${randomSuffix}`,
    email: `test_${timestamp}_${randomSuffix}@playchat.test`,
    password: 'TestPassword123!',
    displayName: `Test User ${randomSuffix}`,
  };

  // Register the user via API
  const response = await fetch('http://localhost:3000/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: user.username,
      email: user.email,
      password: user.password,
      displayName: user.displayName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create test user: ${response.statusText}`);
  }

  return user;
}
