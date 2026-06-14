import { expect, test } from '@playwright/test';
import {
  emitSpeechResult,
  getSpeechMockState,
  installSpeechRecognitionMock
} from '../helpers/speechMock.js';

const hiddenClass = /(^|\s)hidden(\s|$)/;

test.beforeEach(async ({ page }) => {
  await installSpeechRecognitionMock(page);
  await page.goto('/');
});

test('starts speech recognition only after moving past setup', async ({ page }) => {
  await expect.poll(async () => getSpeechMockState(page)).toMatchObject({
    instanceCount: 0,
    startCount: 0
  });

  await page.getByRole('button', { name: '🏁 경기 시작하기 (터치!)' }).click();

  await expect.poll(async () => getSpeechMockState(page)).toMatchObject({
    instanceCount: 1,
    startCount: 1,
    latestStarted: true
  });
});

test('uses speech commands during mission flow', async ({ page }) => {
  await page.locator('button[data-lap-diff="-10"]').click();
  await page.getByRole('button', { name: '🏁 경기 시작하기 (터치!)' }).click();

  await emitSpeechResult(page, '가');
  await expect(page.locator('#lap-records-list')).toContainText('비행 중');

  await page.waitForTimeout(150);
  await emitSpeechResult(page, '끝');

  await expect(page.locator('#screen-result')).not.toHaveClass(hiddenClass, { timeout: 3000 });
  await expect.poll(async () => getSpeechMockState(page)).toMatchObject({
    stopCount: 2,
    latestStarted: false
  });
  await expect(page.locator('#status-text')).toHaveText('음성 인식 꺼짐');
});
