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

test('stores up to three favorite rockets and destinations locally', async ({ page }) => {
  await page.locator('button[data-action="selectCarCategory"][data-category="전체"]').click();
  await page.locator('button[data-action="selectDestinationCategory"][data-category="전체"]').click();

  await page.locator('button[data-favorite-car-id="car-1"]').click();
  await page.locator('button[data-favorite-car-id="car-2"]').click();
  await page.locator('button[data-favorite-car-id="car-3"]').click();
  await page.locator('button[data-favorite-car-id="car-4"]').click();

  await page.locator('button[data-favorite-destination-id="destination-1"]').click();
  await page.locator('button[data-favorite-destination-id="destination-2"]').click();
  await page.locator('button[data-favorite-destination-id="destination-3"]').click();
  await page.locator('button[data-favorite-destination-id="destination-4"]').click();

  await expect.poll(async () => page.evaluate(() => {
    const preferences = JSON.parse(localStorage.getItem('spaceTimerPreferences'));
    return {
      favoriteCars: preferences.favoriteCars,
      favoriteDestinations: preferences.favoriteDestinations
    };
  })).toEqual({
    favoriteCars: ['car-4', 'car-3', 'car-2'],
    favoriteDestinations: ['destination-4', 'destination-3', 'destination-2']
  });

  await page.reload();

  await expect(page.locator('#favorite-car-list')).toContainText('4');
  await expect(page.locator('#favorite-destination-list')).toContainText('4');
  await expect(page.locator('#favorite-car-list button')).toHaveCount(3);
  await expect(page.locator('#favorite-destination-list button')).toHaveCount(3);
});
