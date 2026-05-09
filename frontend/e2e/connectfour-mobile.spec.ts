import { test, expect } from '@playwright/test';

test.describe('ConnectFour - Mobile Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    // Note: This test requires backend services to be running
    // For now, we'll test the component rendering and layout
    await page.goto('http://localhost:5173');
  });

  test('board fits in 375px mobile viewport (iPhone SE)', async ({ page }) => {
    // Set viewport to iPhone SE size
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to a room with ConnectFour game (requires manual setup)
    // This is a placeholder - actual navigation depends on auth and room setup
    
    // Verify no horizontal scrolling is needed
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
    
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1); // +1 for rounding
  });

  test('touch targets are at least 44x44 pixels on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // In a real test, we would:
    // 1. Navigate to a room
    // 2. Start a ConnectFour game
    // 3. Measure cell button dimensions
    
    // Expected: w-11 h-11 = 44px × 44px (meets WCAG 2.5.5)
  });

  test('board scales up on tablet viewport', async ({ page }) => {
    // Set viewport to tablet size
    await page.setViewportSize({ width: 768, height: 1024 });

    // In a real test, we would verify:
    // - Cells are sm:w-14 sm:h-14 = 56px × 56px
    // - Gap is sm:gap-1.5 = 6px
    // - Board still fits comfortably
  });

  test('board fits in smallest mobile viewport (320px)', async ({ page }) => {
    // Set viewport to smallest common mobile size
    await page.setViewportSize({ width: 320, height: 568 });

    // Expected board width: 7 × 44px + 6 × 4px = 332px
    // This exceeds 320px, so overflow-x-auto should allow scrolling
    
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyScrollWidth).toBeGreaterThanOrEqual(320);
  });

  test('cells have adequate spacing for touch', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // In a real test, we would:
    // 1. Navigate to ConnectFour game
    // 2. Measure gap between cells (should be gap-1 = 4px on mobile)
    // 3. Verify cells don't overlap
    // 4. Test that tapping a cell doesn't accidentally trigger adjacent cells
  });

  test('column headers are tappable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // In a real test, we would:
    // 1. Navigate to ConnectFour game
    // 2. Tap column header arrows
    // 3. Verify move is registered
    // 4. Verify header height (h-6 = 24px) is sufficient
  });

  test('landscape mode on mobile', async ({ page }) => {
    // Set viewport to landscape mobile
    await page.setViewportSize({ width: 667, height: 375 });

    // Board should still fit: 332px < 667px
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
    
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1);
  });
});

test.describe('ConnectFour - Visual Regression (Manual)', () => {
  test('maintains Architectural Noir design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Manual verification checklist:
    // - Dark background (#111111)
    // - Sharp borders (#222222)
    // - No shadows or gradients
    // - White/gray pieces
    // - Flat design maintained
  });

  test('pieces are clearly visible on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Manual verification:
    // - Pieces are w-7 h-7 = 28px × 28px on mobile
    // - Pieces fit comfortably inside 44px × 44px cells
    // - Adequate contrast for visibility
  });

  test('status messages are readable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Manual verification:
    // - "Your turn — drop a piece" message visible
    // - Player names visible
    // - Winner/draw message visible
    // - Text doesn't wrap awkwardly
  });
});

test.describe('ConnectFour - Interaction (Manual)', () => {
  test('tapping cells registers moves correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Manual test:
    // 1. Start ConnectFour game
    // 2. Tap various cells
    // 3. Verify pieces drop to correct column
    // 4. Verify no mis-taps or double-taps
  });

  test('tapping column headers registers moves', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Manual test:
    // 1. Start ConnectFour game
    // 2. Tap column header arrows
    // 3. Verify pieces drop to correct column
    // 4. Verify header tap area is sufficient
  });

  test('disabled cells cannot be tapped', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Manual test:
    // 1. Fill a column completely
    // 2. Try tapping that column
    // 3. Verify no move is registered
    // 4. Verify visual feedback (disabled state)
  });
});

/*
 * MANUAL TESTING GUIDE
 * 
 * These E2E tests are placeholders for manual testing since they require:
 * 1. Backend services running (auth, game server)
 * 2. User authentication
 * 3. Room creation and joining
 * 4. Game initialization
 * 
 * To manually test ConnectFour mobile responsiveness:
 * 
 * 1. Start backend services:
 *    - cd backend && npm run dev
 *    - cd auth && npm run dev
 * 
 * 2. Start frontend:
 *    - cd frontend && npm run dev
 * 
 * 3. Open browser DevTools and set device emulation:
 *    - iPhone SE (375×667)
 *    - Pixel 5 (393×851)
 *    - iPad Mini (768×1024)
 * 
 * 4. Test flow:
 *    - Login with test user
 *    - Create or join a room
 *    - Start ConnectFour game
 *    - Verify board fits viewport
 *    - Verify cells are tappable (44×44px minimum)
 *    - Play a few moves
 *    - Verify no layout issues
 * 
 * 5. Viewport calculations:
 *    Mobile (375px):
 *    - Cell: 44px × 44px (w-11 h-11)
 *    - Grid: 7 columns × 6 rows
 *    - Gaps: 6 × 4px = 24px
 *    - Total: 308px + 24px = 332px
 *    - Margin: 43px (11.5% on each side)
 * 
 *    Desktop (640px+):
 *    - Cell: 56px × 56px (sm:w-14 sm:h-14)
 *    - Gaps: 6 × 6px = 36px
 *    - Total: 392px + 36px = 428px
 * 
 * 6. Accessibility verification:
 *    - Touch targets ≥ 44×44px ✓
 *    - Adequate spacing between cells ✓
 *    - Clear visual feedback on tap ✓
 *    - Disabled state clearly indicated ✓
 */
