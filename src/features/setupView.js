(() => {
  let state = null;
  let data = null;
  let dom = null;
  let preferences = null;
  let kitanPlan = null;
  let primeUserAudio = () => {};
  let playClick = () => {};

  function init(options) {
    state = options.state;
    data = options.data;
    dom = options.dom;
    preferences = options.preferences;
    kitanPlan = options.kitanPlan;
    primeUserAudio = options.primeUserAudio;
    playClick = options.playClick;
  }

  function getFilteredEntries(collection, category) {
    const entries = Object.entries(collection);
    if (category === '전체') return entries;
    return entries.filter(([, item]) => item.category === category);
  }

  function renderCategoryTabs(containerId, categories, selectedCategory, onSelectName) {
    const container = dom.byId(containerId);
    if (!container) return;
    container.innerHTML = categories.map(category => {
      const icon = data.CATEGORY_ICONS[category] || '✨';
      const isSelected = category === selectedCategory;
      const selectedClass = isSelected
        ? 'bg-yellow-400 text-slate-950 border-yellow-200'
        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800';
      return `
        <button type="button" data-action="${onSelectName}" data-category="${category}" class="shrink-0 game-font text-[10px] md:text-xs px-2 py-1.5 rounded-xl border ${selectedClass} transition-colors flex items-center gap-1">
          <span class="text-sm leading-none">${icon}</span>
          <span>${category}</span>
        </button>
      `;
    }).join('');
  }

  function renderCarCategoryTabs() {
    renderCategoryTabs('car-category-tabs', data.CAR_CATEGORIES, state.selectedCarCategory, 'selectCarCategory');
  }

  function renderDestinationCategoryTabs() {
    renderCategoryTabs(
      'destination-category-tabs',
      data.DESTINATION_CATEGORIES,
      state.selectedDestinationCategory,
      'selectDestinationCategory'
    );
  }

  function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function pickRandomCategory(categories) {
    const selectableCategories = categories.filter(category => category !== '전체');
    return pickRandom(selectableCategories.length ? selectableCategories : categories);
  }

  function randomizeMissionSelection(shouldPrimeAudio = true) {
    if (shouldPrimeAudio) primeUserAudio();

    state.selectedCarCategory = pickRandomCategory(data.CAR_CATEGORIES);
    state.selectedDestinationCategory = pickRandomCategory(data.DESTINATION_CATEGORIES);

    renderCarCategoryTabs();
    renderDestinationCategoryTabs();
    renderCarSelectionGrid();
    renderDestinationSelectionGrid();

    const randomCar = pickRandom(getFilteredEntries(data.CARS, state.selectedCarCategory));
    const randomDestination = pickRandom(getFilteredEntries(data.DESTINATIONS, state.selectedDestinationCategory));

    if (randomCar) selectCar(randomCar[0], false);
    if (randomDestination) selectDestination(randomDestination[0], false);
    if (shouldPrimeAudio) playClick();
  }

  function renderFavoriteCars() {
    const container = dom.byId('favorite-car-list');
    if (!container) return;
    const favorites = preferences.getFavoriteCars().filter(id => data.CARS[id]);
    container.innerHTML = favorites.length ? favorites.map(id => {
      const car = data.CARS[id];
      return `
        <span class="favorite-chip inline-flex items-center max-w-full rounded-lg bg-indigo-700 text-indigo-50 border border-indigo-400 overflow-hidden">
          <button type="button" data-car-id="${id}" class="game-font text-[10px] md:text-xs px-2 py-1 flex items-center gap-1 min-w-0">
            <span>${car.number}</span>
            <span>${car.emoji}</span>
            <span class="truncate">${car.label}</span>
          </button>
          <button type="button" data-remove-favorite-car-id="${id}" class="game-font px-1.5 py-1 text-[10px] bg-indigo-800/70 hover:bg-indigo-600 border-l border-indigo-300/30" aria-label="${car.label} 자주 선택 목록에서 제외">x</button>
        </span>
      `;
    }).join('') : '<span class="game-font text-[10px] text-slate-500">자주 선택하면 여기에 표시됩니다</span>';
  }

  function renderFavoriteDestinations() {
    const container = dom.byId('favorite-destination-list');
    if (!container) return;
    const favorites = preferences.getFavoriteDestinations().filter(id => data.DESTINATIONS[id]);
    container.innerHTML = favorites.length ? favorites.map(id => {
      const destination = data.DESTINATIONS[id];
      return `
        <span class="favorite-chip inline-flex items-center max-w-full rounded-lg bg-indigo-700 text-indigo-50 border border-indigo-400 overflow-hidden">
          <button type="button" data-destination-id="${id}" class="game-font text-[10px] md:text-xs px-2 py-1 flex items-center gap-1 min-w-0">
            <span>${destination.number}</span>
            <span>${destination.icon}</span>
            <span class="truncate">${destination.name}</span>
          </button>
          <button type="button" data-remove-favorite-destination-id="${id}" class="game-font px-1.5 py-1 text-[10px] bg-indigo-800/70 hover:bg-indigo-600 border-l border-indigo-300/30" aria-label="${destination.name} 자주 선택 목록에서 제외">x</button>
        </span>
      `;
    }).join('') : '<span class="game-font text-[10px] text-slate-500">자주 선택하면 여기에 표시됩니다</span>';
  }

  function renderFavorites() {
    renderFavoriteCars();
    renderFavoriteDestinations();
  }

  function renderKitanStartOptions() {
    renderKitanPlan();
  }

  function renderKitanPlan() {
    const position = kitanPlan.fromIndex(kitanPlan.getNextStartIndex());
    const seriesLabel = dom.byId('kitan-series-label');
    const bookLabel = dom.byId('kitan-book-label');
    const pageInput = dom.byId('kitan-page-input');
    const rangeLabel = dom.byId('kitan-current-range');

    if (seriesLabel) seriesLabel.textContent = position.series;
    if (bookLabel) bookLabel.textContent = `${position.book}권`;
    if (pageInput) pageInput.value = String(position.page);
    if (pageInput) pageInput.min = String(((position.book - 1) * kitanPlan.PAGES_PER_BOOK) + 1);
    if (pageInput) pageInput.max = String(position.book * kitanPlan.PAGES_PER_BOOK);
    if (rangeLabel) rangeLabel.textContent = kitanPlan.formatRange(position.index, state.targetLaps);
    renderKitanCalendar();
  }

  function renderKitanCalendar() {
    const list = dom.byId('kitan-calendar-list');
    if (!list) return;
    const calendars = kitanPlan.getCalendars(state.targetLaps);
    list.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h4 class="game-font text-lg text-emerald-200">완료까지 전체 계획</h4>
        <div class="flex flex-wrap gap-1 text-[10px]">
          ${kitanPlan.SERIES.map(series => `
            <span class="kitan-series-chip kitan-series-${series}">${series}</span>
          `).join('')}
        </div>
      </div>
      <div class="space-y-5">
        ${calendars.map(calendar => `
          <section class="kitan-calendar-month">
            <h5 class="game-font text-base md:text-lg text-slate-100 mb-2">${calendar.monthLabel}</h5>
            <div class="kitan-calendar-grid">
              ${calendar.weekdays.map((weekday, index) => `
                <div class="kitan-calendar-weekday game-font ${index === 0 ? 'is-sunday' : ''} ${index === 6 ? 'is-saturday' : ''}">${weekday}</div>
              `).join('')}
              ${calendar.weeks.flat().map(day => `
                <div class="kitan-calendar-day ${day.isToday ? 'is-today' : ''} ${day.isCurrentMonth ? '' : 'is-muted'} ${day.isSunday ? 'is-sunday' : ''} ${day.isSaturday ? 'is-saturday' : ''} ${day.plan ? `kitan-series-${day.plan.series}` : ''}">
                  <div class="flex items-center justify-between gap-1">
                    <span class="game-font text-xs">${day.dayNumber}</span>
                    ${day.isToday ? '<span class="game-font text-[9px]">오늘</span>' : ''}
                  </div>
                  ${day.plan ? `
                    <div class="mt-1">
                      <span class="game-font text-[10px]">${day.plan.dayLabel}</span>
                      <p class="game-font text-[10px] md:text-xs leading-tight">${day.plan.rangeLabel}</p>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        `).join('')}
      </div>
    `;
  }

  function updateKitanStart(field, value) {
    primeUserAudio();
    const current = kitanPlan.fromIndex(kitanPlan.getNextStartIndex());
    const next = {
      series: current.series,
      book: current.book,
      page: current.page,
      [field]: value
    };
    kitanPlan.setNextStart(next.series, next.book, next.page);
    renderKitanPlan();
    playClick();
  }

  function changeKitanPage(diff) {
    primeUserAudio();
    kitanPlan.setNextStartIndex(kitanPlan.getNextStartIndex() + diff);
    renderKitanPlan();
    playClick();
  }

  function changeKitanStep(field, diff) {
    primeUserAudio();
    const current = kitanPlan.fromIndex(kitanPlan.getNextStartIndex());
    const seriesIndex = kitanPlan.SERIES.indexOf(current.series);
    const nextSeriesIndex = Math.max(0, Math.min(kitanPlan.SERIES.length - 1, seriesIndex + diff));
    const nextBook = Math.max(1, Math.min(kitanPlan.BOOKS_PER_SERIES, current.book + diff));

    if (field === 'series') {
      kitanPlan.setNextStart(kitanPlan.SERIES[nextSeriesIndex], 1, 1);
    } else if (field === 'book') {
      const firstPage = ((nextBook - 1) * kitanPlan.PAGES_PER_BOOK) + 1;
      kitanPlan.setNextStart(current.series, nextBook, firstPage);
    }

    renderKitanPlan();
    playClick();
  }

  function openKitanCalendar() {
    renderKitanCalendar();
    dom.byId('kitan-calendar-modal')?.classList.remove('hidden');
  }

  function closeKitanCalendar() {
    dom.byId('kitan-calendar-modal')?.classList.add('hidden');
  }

  function scrollCardIntoSelectionView(card, gridId) {
    const grid = dom.byId(gridId);
    if (!card || !grid) return;
    requestAnimationFrame(() => {
      const gridRect = grid.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const nextScrollTop = grid.scrollTop
        + (cardRect.top - gridRect.top)
        - (grid.clientHeight / 2)
        + (cardRect.height / 2);

      grid.scrollTo({
        top: Math.max(0, nextScrollTop),
        behavior: 'smooth'
      });
    });
  }

  function resetDestinationTarget() {
    const destinationTarget = dom.byId('track-destination-target');
    if (!destinationTarget) return;
    destinationTarget.classList.remove('destination-hit');
    void destinationTarget.offsetWidth;
  }

  function renderCarSelectionGrid() {
    const grid = dom.byId('car-selection-grid');
    if (!grid) return;
    const visibleCars = getFilteredEntries(data.CARS, state.selectedCarCategory);
    grid.innerHTML = visibleCars.map(([id, car]) => `
      <div id="car-select-${id}" class="car-card relative min-w-0 bg-slate-700/50 hover:bg-slate-700 border-4 border-transparent rounded-2xl p-2 transition-all transform hover:-translate-y-1 text-center min-h-[96px]">
        <button type="button" data-car-id="${id}" class="w-full min-h-[76px] flex flex-col justify-center">
          <span class="absolute left-1.5 top-1.5 min-w-5 px-1 rounded-md bg-slate-950/80 text-[9px] font-bold text-slate-300 border border-slate-600">${car.number}</span>
          <span class="${car.isSideways ? 'sideways-flight' : 'inline-block'} text-3xl md:text-4xl block mb-1">${car.emoji}</span>
          <span class="game-font text-[9px] md:text-[10px] ${car.textClass} leading-tight break-keep">${car.label}</span>
        </button>
      </div>
    `).join('');
  }

  function renderDestinationSelectionGrid() {
    const grid = dom.byId('destination-selection-grid');
    if (!grid) return;
    const visibleDestinations = getFilteredEntries(data.DESTINATIONS, state.selectedDestinationCategory);
    grid.innerHTML = visibleDestinations.map(([id, destination]) => `
      <div id="destination-select-${id}" class="destination-card relative min-w-0 bg-slate-700/50 hover:bg-slate-700 border-4 border-transparent rounded-2xl p-2 transition-all transform hover:-translate-y-1 text-center min-h-[96px]">
        <button type="button" data-destination-id="${id}" class="w-full min-h-[76px] flex flex-col justify-center">
          <span class="absolute left-1.5 top-1.5 min-w-5 px-1 rounded-md bg-slate-950/80 text-[9px] font-bold text-slate-300 border border-slate-600">${destination.number}</span>
          <span class="text-3xl md:text-4xl block mb-1">${destination.icon}</span>
          <span class="game-font text-[9px] md:text-[10px] ${destination.textClass} leading-tight break-keep">${destination.name}</span>
        </button>
      </div>
    `).join('');
  }

  function selectCarCategory(category) {
    state.selectedCarCategory = category;
    renderCarCategoryTabs();
    renderCarSelectionGrid();
    if (!getFilteredEntries(data.CARS, state.selectedCarCategory).some(([id]) => id === state.chosenCar)) {
      const firstVisibleCar = getFilteredEntries(data.CARS, state.selectedCarCategory)[0];
      if (firstVisibleCar) selectCar(firstVisibleCar[0], true, false);
    } else {
      selectCar(state.chosenCar, false, false);
    }
  }

  function selectDestinationCategory(category) {
    state.selectedDestinationCategory = category;
    renderDestinationCategoryTabs();
    renderDestinationSelectionGrid();
    if (!getFilteredEntries(data.DESTINATIONS, state.selectedDestinationCategory)
      .some(([id]) => id === state.chosenDestination)) {
      const firstVisibleDestination = getFilteredEntries(data.DESTINATIONS, state.selectedDestinationCategory)[0];
      if (firstVisibleDestination) selectDestination(firstVisibleDestination[0], true, false);
    } else {
      selectDestination(state.chosenDestination, false, false);
    }
  }

  function selectCar(color, shouldPrimeAudio = true, shouldScroll = true) {
    if (shouldPrimeAudio) primeUserAudio();
    const car = data.CARS[color];
    if (!car) return;

    if (!dom.byId(`car-select-${color}`)) {
      state.selectedCarCategory = car.category;
      renderCarCategoryTabs();
      renderCarSelectionGrid();
    }

    state.chosenCar = color;
    if (shouldScroll) {
      preferences.recordCarSelection(color);
      renderFavoriteCars();
    }

    dom.all('.car-card').forEach(card => {
      Object.values(data.CARS).forEach(car => card.classList.remove(car.borderClass));
      card.classList.add('border-transparent');
    });

    const targetCard = dom.byId(`car-select-${color}`);
    if (!targetCard) return;
    targetCard.classList.remove('border-transparent');
    targetCard.classList.add(car.borderClass);
    if (shouldScroll) scrollCardIntoSelectionView(targetCard, 'car-selection-grid');

    const trackCar = dom.byId('track-car');
    trackCar.innerHTML = car.emoji;
    trackCar.classList.toggle('sideways-flight', car.isSideways);
    dom.byId('track-start-label').textContent = `출발 (${car.label})`;
    dom.byId('result-car-emoji').innerHTML = car.emoji;
    playClick();
  }

  function toggleFavoriteCar(id) {
    primeUserAudio();
    if (!data.CARS[id]) return;
    preferences.toggleFavoriteCar(id);
    renderFavoriteCars();
    renderCarSelectionGrid();
    selectCar(state.chosenCar, false, false);
    playClick();
  }

  function removeFavoriteCar(id) {
    primeUserAudio();
    preferences.removeFavoriteCar(id);
    renderFavoriteCars();
    renderCarSelectionGrid();
    selectCar(state.chosenCar, false, false);
    playClick();
  }

  function selectDestination(destinationId, shouldPrimeAudio = true, shouldScroll = true) {
    if (shouldPrimeAudio) primeUserAudio();
    const destination = data.DESTINATIONS[destinationId];
    if (!destination) return;

    if (!dom.byId(`destination-select-${destinationId}`)) {
      state.selectedDestinationCategory = destination.category;
      renderDestinationCategoryTabs();
      renderDestinationSelectionGrid();
    }

    state.chosenDestination = destinationId;
    if (shouldScroll) {
      preferences.recordDestinationSelection(destinationId);
      renderFavoriteDestinations();
    }

    dom.all('.destination-card').forEach(card => {
      Object.values(data.DESTINATIONS).forEach(destination => card.classList.remove(destination.borderClass));
      card.classList.add('border-transparent');
    });

    const targetCard = dom.byId(`destination-select-${destinationId}`);
    if (!targetCard) return;
    targetCard.classList.remove('border-transparent');
    targetCard.classList.add(destination.borderClass);
    if (shouldScroll) scrollCardIntoSelectionView(targetCard, 'destination-selection-grid');
    resetDestinationTarget();
    dom.byId('track-destination-target-icon').textContent = destination.icon;
    dom.byId('track-destination-name').textContent = `도착 (${destination.name})`;
    playClick();
  }

  function toggleFavoriteDestination(id) {
    primeUserAudio();
    if (!data.DESTINATIONS[id]) return;
    preferences.toggleFavoriteDestination(id);
    renderFavoriteDestinations();
    renderDestinationSelectionGrid();
    selectDestination(state.chosenDestination, false, false);
    playClick();
  }

  function removeFavoriteDestination(id) {
    primeUserAudio();
    preferences.removeFavoriteDestination(id);
    renderFavoriteDestinations();
    renderDestinationSelectionGrid();
    selectDestination(state.chosenDestination, false, false);
    playClick();
  }

  function changeLaps(diff) {
    primeUserAudio();
    state.targetLaps = Math.max(1, Math.min(1000, state.targetLaps + diff));
    dom.byId('setup-lap-count').textContent = state.targetLaps;
    renderKitanPlan();
    playClick();
  }

  window.SpaceTimerSetupView = {
    init,
    renderCarCategoryTabs,
    renderDestinationCategoryTabs,
    renderCarSelectionGrid,
    renderDestinationSelectionGrid,
    renderFavorites,
    renderKitanStartOptions,
    renderKitanPlan,
    updateKitanStart,
    changeKitanPage,
    changeKitanStep,
    openKitanCalendar,
    closeKitanCalendar,
    randomizeMissionSelection,
    selectCarCategory,
    selectDestinationCategory,
    selectCar,
    selectDestination,
    toggleFavoriteCar,
    toggleFavoriteDestination,
    removeFavoriteCar,
    removeFavoriteDestination,
    changeLaps,
    resetDestinationTarget
  };
})();
