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
  await page.locator('button[data-lap-diff="1"]').click();
  await expect(page.locator('#setup-lap-count')).toHaveText('11');
  await expect(page.locator('#kitan-current-range')).toHaveText('F-1 1~11장');

  await page.locator('button[data-lap-diff="-10"]').click();
  await page.locator('button[data-lap-diff="-10"]').click();
  await expect(page.locator('#setup-lap-count')).toHaveText('1');
  await expect(page.locator('#kitan-current-range')).toHaveText('F-1 1장');
});

test('shows Kitan start range and calendar plan by series color', async ({ page }) => {
  await expect(page.locator('#kitan-current-range')).toHaveText('F-1 1~10장');

  await page.locator('button[data-kitan-page-diff="10"]').click();
  await expect(page.locator('#kitan-current-range')).toHaveText('F-1 11~20장');
  await page.locator('button[data-kitan-page-diff="-10"]').click();
  await expect(page.locator('#kitan-current-range')).toHaveText('F-1 1~10장');

  await page.locator('#kitan-page-input').fill('11');
  await page.locator('#kitan-page-input').blur();
  await expect(page.locator('#kitan-current-range')).toHaveText('F-1 11~20장');

  await page.locator('button[data-kitan-step-diff="series:1"]').click();
  await page.locator('button[data-kitan-step-diff="book:1"]').click();
  await page.locator('#kitan-page-input').fill('65');
  await page.locator('#kitan-page-input').blur();
  await expect(page.locator('#kitan-series-label')).toHaveText('G');
  await expect(page.locator('#kitan-book-label')).toHaveText('2권');
  await expect(page.locator('#kitan-current-range')).toHaveText('G-2 65~74장');

  await page.locator('button[data-action="open-kitan-calendar"]').click();
  await expect(page.locator('#kitan-calendar-modal')).not.toHaveClass(hiddenClass);
  await expect.poll(async () => page.locator('.kitan-calendar-month').count()).toBeGreaterThan(1);
  await expect.poll(async () => page.locator('.kitan-calendar-weekday').count()).toBeGreaterThan(7);
  await expect.poll(async () => page.locator('.kitan-calendar-day').count()).toBeGreaterThanOrEqual(35);
  await expect(page.locator('.kitan-calendar-day.is-today')).toContainText('오늘');
  await expect(page.locator('.kitan-calendar-day.is-today')).toContainText('G-2 65~74장');
  await expect(page.locator('.kitan-calendar-day.is-today')).toHaveClass(/kitan-series-G/);
  await expect(page.locator('.kitan-series-chip.kitan-series-G')).toHaveText('G');
  await expect.poll(async () => page.locator('.kitan-calendar-weekday.is-sunday').count()).toBeGreaterThan(1);
  await expect.poll(async () => page.locator('.kitan-calendar-weekday.is-saturday').count()).toBeGreaterThan(1);
  await expect.poll(async () => page.locator('.kitan-calendar-day.is-sunday').count()).toBeGreaterThan(1);
  await expect.poll(async () => page.locator('.kitan-calendar-day.is-saturday').count()).toBeGreaterThan(1);
  await expect(page.locator('#kitan-calendar-list')).toContainText('G-2 75~84장');

  await page.locator('button[data-action="close-kitan-calendar"]').click();
  await expect(page.locator('#kitan-calendar-modal')).toHaveClass(hiddenClass);
});

test('shows the three most selected items and promotes the next rank when excluded', async ({ page }) => {
  await page.locator('button[data-action="selectCarCategory"][data-category="전체"]').click();
  await page.locator('button[data-action="selectDestinationCategory"][data-category="전체"]').click();

  const selectMany = async (selector, count) => {
    for (let index = 0; index < count; index += 1) await page.locator(selector).click();
  };

  await selectMany('#car-selection-grid button[data-car-id="car-1"]', 4);
  await selectMany('#car-selection-grid button[data-car-id="car-2"]', 3);
  await selectMany('#car-selection-grid button[data-car-id="car-3"]', 2);
  await selectMany('#car-selection-grid button[data-car-id="car-4"]', 1);
  await selectMany('#destination-selection-grid button[data-destination-id="destination-1"]', 4);
  await selectMany('#destination-selection-grid button[data-destination-id="destination-2"]', 3);
  await selectMany('#destination-selection-grid button[data-destination-id="destination-3"]', 2);
  await selectMany('#destination-selection-grid button[data-destination-id="destination-4"]', 1);

  await expect(page.locator('#favorite-car-list [data-car-id]')).toHaveCount(3);
  await expect(page.locator('#favorite-car-list [data-car-id]').first()).toHaveAttribute('data-car-id', 'car-1');
  await expect(page.locator('#favorite-destination-list [data-destination-id]')).toHaveCount(3);

  await page.locator('#favorite-car-list [data-remove-favorite-car-id="car-1"]').click();
  await page.locator('#favorite-destination-list [data-remove-favorite-destination-id="destination-1"]').click();
  await expect(page.locator('#favorite-car-list [data-car-id="car-4"]')).toHaveCount(1);
  await expect(page.locator('#favorite-destination-list [data-destination-id="destination-4"]')).toHaveCount(1);

  await selectMany('#car-selection-grid button[data-car-id="car-1"]', 3);
  await selectMany('#destination-selection-grid button[data-destination-id="destination-1"]', 3);
  await expect(page.locator('#favorite-car-list [data-car-id="car-1"]')).toHaveCount(1);
  await expect(page.locator('#favorite-destination-list [data-destination-id="destination-1"]')).toHaveCount(1);

  await page.reload();
  await expect(page.locator('#favorite-car-list [data-car-id]')).toHaveCount(3);
  await expect(page.locator('#favorite-destination-list [data-destination-id]')).toHaveCount(3);
});