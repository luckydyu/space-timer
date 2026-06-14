import { expect, test } from '@playwright/test';
import { getSpeechMockState, installSpeechRecognitionMock } from '../helpers/speechMock.js';

const hiddenClass = /(^|\s)hidden(\s|$)/;

test.beforeEach(async ({ page }) => {
  await installSpeechRecognitionMock(page);
  await page.goto('/');
});

test('loads setup screen without starting speech recognition immediately', async ({ page }) => {
  await expect(page.locator('#screen-setup')).not.toHaveClass(hiddenClass);
  await expect(page.locator('#screen-running')).toHaveClass(hiddenClass);
  await expect(page.locator('#screen-result')).toHaveClass(hiddenClass);
  await expect(page.locator('#status-text')).toHaveText('첫 미션부터 마이크 대기');
  await expect(page.locator('#mic-toggle-input')).toBeChecked();

  await expect.poll(async () => getSpeechMockState(page)).toMatchObject({
    instanceCount: 0,
    startCount: 0
  });
});

test('updates lap target within the setup screen bounds', async ({ page }) => {
  await page.getByRole('button', { name: '+1', exact: true }).click();
  await expect(page.locator('#setup-lap-count')).toHaveText('11');

  await page.getByRole('button', { name: '-10', exact: true }).click();
  await page.getByRole('button', { name: '-10', exact: true }).click();
  await expect(page.locator('#setup-lap-count')).toHaveText('1');
});
