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

  await page.locator('#kitan-series-select').selectOption('G');
  await page.locator('#kitan-book-select').selectOption('2');
  await page.locator('#kitan-page-input').fill('5');
  await page.locator('#kitan-page-input').blur();
  await expect(page.locator('#kitan-current-range')).toHaveText('G-2 5~14장');

  await page.locator('button[data-action="open-kitan-calendar"]').click();
  await expect(page.locator('#kitan-calendar-modal')).not.toHaveClass(hiddenClass);
  await expect.poll(async () => page.locator('.kitan-calendar-month').count()).toBeGreaterThan(1);
  await expect.poll(async () => page.locator('.kitan-calendar-weekday').count()).toBeGreaterThan(7);
  await expect.poll(async () => page.locator('.kitan-calendar-day').count()).toBeGreaterThanOrEqual(35);
  await expect(page.locator('.kitan-calendar-day.is-today')).toContainText('오늘');
  await expect(page.locator('.kitan-calendar-day.is-today')).toContainText('G-2 5~14장');
  await expect(page.locator('.kitan-calendar-day.is-today')).toHaveClass(/kitan-series-G/);
  await expect(page.locator('.kitan-series-chip.kitan-series-G')).toHaveText('G');
  await expect.poll(async () => page.locator('.kitan-calendar-weekday.is-sunday').count()).toBeGreaterThan(1);
  await expect.poll(async () => page.locator('.kitan-calendar-weekday.is-saturday').count()).toBeGreaterThan(1);
  await expect.poll(async () => page.locator('.kitan-calendar-day.is-sunday').count()).toBeGreaterThan(1);
  await expect.poll(async () => page.locator('.kitan-calendar-day.is-saturday').count()).toBeGreaterThan(1);
  await expect(page.locator('#kitan-calendar-list')).toContainText('G-2 15~24장');

  await page.locator('button[data-action="close-kitan-calendar"]').click();
  await expect(page.locator('#kitan-calendar-modal')).toHaveClass(hiddenClass);
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
  await expect(page.locator('#favorite-car-list [data-car-id]')).toHaveCount(3);
  await expect(page.locator('#favorite-destination-list [data-destination-id]')).toHaveCount(3);
});

test('selects, scrolls to, and removes favorites from the favorite lists', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('spaceTimerPreferences', JSON.stringify({
      favoriteCars: ['car-4', 'car-3', 'car-2'],
      favoriteDestinations: ['destination-4', 'destination-3', 'destination-2']
    }));
    window.SpaceTimerSetupView.renderFavorites();
  });

  await page.evaluate(() => {
    const car = window.SpaceTimerData.CARS['car-4'];
    const destination = window.SpaceTimerData.DESTINATIONS['destination-4'];
    window.SpaceTimerState.selectedCarCategory = window.SpaceTimerData.CAR_CATEGORIES
      .find(category => category !== '전체' && category !== car.category);
    window.SpaceTimerState.selectedDestinationCategory = window.SpaceTimerData.DESTINATION_CATEGORIES
      .find(category => category !== '전체' && category !== destination.category);
    window.SpaceTimerSetupView.renderCarCategoryTabs();
    window.SpaceTimerSetupView.renderDestinationCategoryTabs();
    window.SpaceTimerSetupView.renderCarSelectionGrid();
    window.SpaceTimerSetupView.renderDestinationSelectionGrid();
  });

  await expect(page.locator('#car-select-car-4')).toHaveCount(0);
  await page.locator('#favorite-car-list [data-car-id="car-4"]').click();
  await expect.poll(async () => page.evaluate(() => {
    const grid = document.querySelector('#car-selection-grid').getBoundingClientRect();
    const card = document.querySelector('#car-select-car-4').getBoundingClientRect();
    return {
      chosenCar: window.SpaceTimerState.chosenCar,
      selectedCategory: window.SpaceTimerState.selectedCarCategory,
      expectedCategory: window.SpaceTimerData.CARS['car-4'].category,
      isVisibleInGrid: card.top >= grid.top && card.bottom <= grid.bottom
    };
  })).toEqual({
    chosenCar: 'car-4',
    selectedCategory: await page.evaluate(() => window.SpaceTimerData.CARS['car-4'].category),
    expectedCategory: await page.evaluate(() => window.SpaceTimerData.CARS['car-4'].category),
    isVisibleInGrid: true
  });

  await expect(page.locator('#destination-select-destination-4')).toHaveCount(0);
  await page.locator('#favorite-destination-list [data-destination-id="destination-4"]').click();
  await expect.poll(async () => page.evaluate(() => {
    const grid = document.querySelector('#destination-selection-grid').getBoundingClientRect();
    const card = document.querySelector('#destination-select-destination-4').getBoundingClientRect();
    return {
      chosenDestination: window.SpaceTimerState.chosenDestination,
      selectedCategory: window.SpaceTimerState.selectedDestinationCategory,
      expectedCategory: window.SpaceTimerData.DESTINATIONS['destination-4'].category,
      isVisibleInGrid: card.top >= grid.top && card.bottom <= grid.bottom
    };
  })).toEqual({
    chosenDestination: 'destination-4',
    selectedCategory: await page.evaluate(() => window.SpaceTimerData.DESTINATIONS['destination-4'].category),
    expectedCategory: await page.evaluate(() => window.SpaceTimerData.DESTINATIONS['destination-4'].category),
    isVisibleInGrid: true
  });

  await page.locator('#favorite-car-list [data-remove-favorite-car-id="car-4"]').click();
  await page.locator('#favorite-destination-list [data-remove-favorite-destination-id="destination-4"]').click();

  await expect.poll(async () => page.evaluate(() => {
    const preferences = JSON.parse(localStorage.getItem('spaceTimerPreferences'));
    return {
      favoriteCars: preferences.favoriteCars,
      favoriteDestinations: preferences.favoriteDestinations
    };
  })).toEqual({
    favoriteCars: ['car-3', 'car-2'],
    favoriteDestinations: ['destination-3', 'destination-2']
  });
});
