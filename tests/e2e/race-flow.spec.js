import { expect, test } from '@playwright/test';
import { getSpeechMockState, installSpeechRecognitionMock } from '../helpers/speechMock.js';

const hiddenClass = /(^|\s)hidden(\s|$)/;

test.beforeEach(async ({ page }) => {
  await installSpeechRecognitionMock(page);
  await page.goto('/');
});

test('starts a one-lap race, records the lap, and shows results', async ({ page }) => {
  await page.getByRole('button', { name: '-10', exact: true }).click();
  await page.getByRole('button', { name: '🏁 경기 시작하기 (터치!)' }).click();

  await expect(page.locator('#screen-setup')).toHaveClass(hiddenClass);
  await expect(page.locator('#screen-running')).not.toHaveClass(hiddenClass);
  await expect(page.locator('#running-lap-indicator')).toHaveText('MISSION 1 / 1');
  await expect(page.locator('#lap-records-list')).toContainText('출발 대기 중');
  await expect.poll(async () => getSpeechMockState(page)).toMatchObject({
    instanceCount: 1,
    startCount: 1,
    latestStarted: true
  });

  await page.locator('#main-action-button').click();
  await expect(page.locator('#lap-records-list')).toContainText('비행 중');

  await page.waitForTimeout(150);
  await page.locator('#main-action-button').click();

  await expect(page.locator('#screen-result')).not.toHaveClass(hiddenClass, { timeout: 3000 });
  await expect(page.locator('#result-total-time')).not.toHaveText('00:00.00');
  await expect(page.locator('#final-lap-details')).toContainText('1장째 학습지 완주');
});

test('returns to setup screen after restart', async ({ page }) => {
  await page.getByRole('button', { name: '-10', exact: true }).click();
  await page.getByRole('button', { name: '🏁 경기 시작하기 (터치!)' }).click();
  await page.locator('#main-action-button').click();
  await page.waitForTimeout(150);
  await page.locator('#main-action-button').click();
  await expect(page.locator('#screen-result')).not.toHaveClass(hiddenClass, { timeout: 3000 });

  await page.locator('button[data-action="restart-app"]').click();

  await expect(page.locator('#screen-setup')).not.toHaveClass(hiddenClass);
  await expect(page.locator('#screen-result')).toHaveClass(hiddenClass);
  await expect(page.locator('#status-text')).toHaveText('첫 미션부터 마이크 대기');
});

test('returns to setup screen when the header title is clicked', async ({ page }) => {
  await page.getByRole('button', { name: '-10', exact: true }).click();
  await page.getByRole('button', { name: '🏁 경기 시작하기 (터치!)' }).click();
  await page.locator('#main-action-button').click();
  await expect(page.locator('#lap-records-list')).toContainText('비행 중');

  await page.getByRole('button', { name: '🚀 우주 초스피드 레이서' }).click();

  await expect(page.locator('#screen-setup')).not.toHaveClass(hiddenClass);
  await expect(page.locator('#screen-running')).toHaveClass(hiddenClass);
  await expect(page.locator('#screen-result')).toHaveClass(hiddenClass);
  await expect(page.locator('#status-text')).toHaveText('첫 미션부터 마이크 대기');
});


test('undoes the latest completed mission and resumes from its elapsed time', async ({ page }) => {
  await page.getByRole('button', { name: '-10', exact: true }).click();
  await page.getByRole('button', { name: '+1', exact: true }).click();
  await expect(page.locator('#setup-lap-count')).toHaveText('2');
  await page.getByRole('button', { name: '🏁 경기 시작하기 (터치!)' }).click();

  await page.locator('#main-action-button').click();
  await page.waitForTimeout(180);
  await page.locator('#main-action-button').click();

  await expect(page.locator('#running-lap-indicator')).toHaveText('MISSION 2 / 2', { timeout: 3000 });
  await expect(page.locator('#undo-last-lap-button')).not.toHaveClass(hiddenClass);
  await expect(page.locator('#lap-records-list')).toContainText('1등');

  await page.locator('#undo-last-lap-button').click();

  await expect(page.locator('#running-lap-indicator')).toHaveText('MISSION 1 / 2');
  await expect(page.locator('#undo-last-lap-button')).toHaveClass(hiddenClass);
  await expect(page.locator('#lap-records-list')).not.toContainText('1등');
  await expect(page.locator('#lap-records-list')).toContainText('출발 대기 중');
  await expect(page.locator('#running-total-time')).not.toHaveText('00:00.00');

  await page.locator('#main-action-button').click();
  await expect(page.locator('#lap-records-list')).toContainText('비행 중');
});
