import { expect, test } from '@playwright/test';

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
      clientWidth: doc.clientWidth,
      innerWidth: window.innerWidth,
    };
  });

  expect(
    overflow.scrollWidth,
    `horizontal overflow detected: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}, innerWidth=${overflow.innerWidth}`
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

test.describe('viewport regression matrix', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('main layout fits within the viewport', async ({ page }) => {
    await assertNoHorizontalOverflow(page);
  });

  test('fab menu and prompt modal stay on screen', async ({ page }) => {
    const fabToggle = page.getByTestId('fab-toggle');
    await expect(fabToggle).toBeVisible();
    await fabToggle.click();

    const createPromptAction = page.getByTestId('fab-create-prompt');
    await expect(createPromptAction).toBeVisible();
    await expect(createPromptAction).toBeInViewport();

    await createPromptAction.click();

    const promptModal = page.getByTestId('prompt-modal');
    await expect(promptModal).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
});
