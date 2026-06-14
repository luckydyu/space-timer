(() => {
  let state = null;
  let data = null;
  let dom = null;
  let primeUserAudio = () => {};
  let playClick = () => {};

  function init(options) {
    state = options.state;
    data = options.data;
    dom = options.dom;
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
      <button type="button" data-car-id="${id}" id="car-select-${id}" class="car-card relative cursor-pointer bg-slate-700/50 hover:bg-slate-700 border-4 border-transparent rounded-2xl p-2 transition-all transform hover:-translate-y-1 text-center min-h-[96px] flex flex-col justify-center">
        <span class="absolute left-1.5 top-1.5 min-w-5 px-1 rounded-md bg-slate-950/80 text-[9px] font-bold text-slate-300 border border-slate-600">${car.number}</span>
        <span class="${car.isSideways ? 'sideways-flight' : 'inline-block'} text-3xl md:text-4xl block mb-1">${car.emoji}</span>
        <span class="game-font text-[9px] md:text-[10px] ${car.textClass} leading-tight break-keep">${car.label}</span>
      </button>
    `).join('');
  }

  function renderDestinationSelectionGrid() {
    const grid = dom.byId('destination-selection-grid');
    if (!grid) return;
    const visibleDestinations = getFilteredEntries(data.DESTINATIONS, state.selectedDestinationCategory);
    grid.innerHTML = visibleDestinations.map(([id, destination]) => `
      <button type="button" data-destination-id="${id}" id="destination-select-${id}" class="destination-card relative cursor-pointer bg-slate-700/50 hover:bg-slate-700 border-4 border-transparent rounded-2xl p-2 transition-all transform hover:-translate-y-1 text-center min-h-[96px] flex flex-col justify-center">
        <span class="absolute left-1.5 top-1.5 min-w-5 px-1 rounded-md bg-slate-950/80 text-[9px] font-bold text-slate-300 border border-slate-600">${destination.number}</span>
        <span class="text-3xl md:text-4xl block mb-1">${destination.icon}</span>
        <span class="game-font text-[9px] md:text-[10px] ${destination.textClass} leading-tight break-keep">${destination.name}</span>
      </button>
    `).join('');
  }

  function selectCarCategory(category) {
    state.selectedCarCategory = category;
    renderCarCategoryTabs();
    renderCarSelectionGrid();
    if (!getFilteredEntries(data.CARS, state.selectedCarCategory).some(([id]) => id === state.chosenCar)) {
      const firstVisibleCar = getFilteredEntries(data.CARS, state.selectedCarCategory)[0];
      if (firstVisibleCar) selectCar(firstVisibleCar[0]);
    } else {
      selectCar(state.chosenCar, false);
    }
  }

  function selectDestinationCategory(category) {
    state.selectedDestinationCategory = category;
    renderDestinationCategoryTabs();
    renderDestinationSelectionGrid();
    if (!getFilteredEntries(data.DESTINATIONS, state.selectedDestinationCategory)
      .some(([id]) => id === state.chosenDestination)) {
      const firstVisibleDestination = getFilteredEntries(data.DESTINATIONS, state.selectedDestinationCategory)[0];
      if (firstVisibleDestination) selectDestination(firstVisibleDestination[0]);
    } else {
      selectDestination(state.chosenDestination, false);
    }
  }

  function selectCar(color, shouldPrimeAudio = true) {
    if (shouldPrimeAudio) primeUserAudio();
    state.chosenCar = color;

    dom.all('.car-card').forEach(card => {
      Object.values(data.CARS).forEach(car => card.classList.remove(car.borderClass));
      card.classList.add('border-transparent');
    });

    const targetCard = dom.byId(`car-select-${color}`);
    if (!targetCard || !data.CARS[color]) return;
    targetCard.classList.remove('border-transparent');
    targetCard.classList.add(data.CARS[color].borderClass);
    scrollCardIntoSelectionView(targetCard, 'car-selection-grid');

    const trackCar = dom.byId('track-car');
    trackCar.innerHTML = data.CARS[color].emoji;
    trackCar.classList.toggle('sideways-flight', data.CARS[color].isSideways);
    dom.byId('track-start-label').textContent = `출발 (${data.CARS[color].label})`;
    dom.byId('result-car-emoji').innerHTML = data.CARS[color].emoji;
    playClick();
  }

  function selectDestination(destinationId, shouldPrimeAudio = true) {
    if (shouldPrimeAudio) primeUserAudio();
    if (!data.DESTINATIONS[destinationId]) return;
    state.chosenDestination = destinationId;

    dom.all('.destination-card').forEach(card => {
      Object.values(data.DESTINATIONS).forEach(destination => card.classList.remove(destination.borderClass));
      card.classList.add('border-transparent');
    });

    const destination = data.DESTINATIONS[destinationId];
    const targetCard = dom.byId(`destination-select-${destinationId}`);
    if (!targetCard) return;
    targetCard.classList.remove('border-transparent');
    targetCard.classList.add(destination.borderClass);
    scrollCardIntoSelectionView(targetCard, 'destination-selection-grid');
    resetDestinationTarget();
    dom.byId('track-destination-target-icon').textContent = destination.icon;
    dom.byId('track-destination-name').textContent = `도착 (${destination.name})`;
    playClick();
  }

  function changeLaps(diff) {
    primeUserAudio();
    state.targetLaps = Math.max(1, Math.min(1000, state.targetLaps + diff));
    dom.byId('setup-lap-count').textContent = state.targetLaps;
    playClick();
  }

  window.SpaceTimerSetupView = {
    init,
    renderCarCategoryTabs,
    renderDestinationCategoryTabs,
    renderCarSelectionGrid,
    renderDestinationSelectionGrid,
    randomizeMissionSelection,
    selectCarCategory,
    selectDestinationCategory,
    selectCar,
    selectDestination,
    changeLaps,
    resetDestinationTarget
  };
})();
