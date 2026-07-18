(() => {
  const STORAGE_KEY = 'spaceTimerPreferences';
  const MAX_FAVORITES = 3;

  function createDefaultPreferences() {
    return { carSelections: {}, destinationSelections: {}, selectionSequence: 0 };
  }

  function readPreferences() {
    try {
      const rawValue = window.localStorage.getItem(STORAGE_KEY);
      if (!rawValue) return createDefaultPreferences();
      const parsedValue = JSON.parse(rawValue);
      return {
        carSelections: parsedValue.carSelections && typeof parsedValue.carSelections === 'object' ? parsedValue.carSelections : {},
        destinationSelections: parsedValue.destinationSelections && typeof parsedValue.destinationSelections === 'object' ? parsedValue.destinationSelections : {},
        selectionSequence: Math.max(0, Number(parsedValue.selectionSequence) || MAX_FAVORITES)
      };
    } catch {
      return createDefaultPreferences();
    }
  }

  function writePreferences(preferences) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Storage can be unavailable in private browsing or restricted environments.
    }
  }

  function getMostSelected(key) {
    return Object.entries(readPreferences()[key])
      .filter(([, value]) => Number(value?.count) > 0)
      .sort(([, a], [, b]) => (b.count - a.count) || (b.lastSelected - a.lastSelected))
      .slice(0, MAX_FAVORITES)
      .map(([id]) => id);
  }

  function getFavoriteCars() {
    return getMostSelected('carSelections');
  }

  function getFavoriteDestinations() {
    return getMostSelected('destinationSelections');
  }

  function recordSelection(key, id) {
    const preferences = readPreferences();
    const current = preferences[key][id] || { count: 0, lastSelected: 0 };
    preferences.selectionSequence += 1;
    preferences[key][id] = { count: current.count + 1, lastSelected: preferences.selectionSequence };
    writePreferences(preferences);
    return getMostSelected(key);
  }

  function removeFavorite(key, id) {
    const preferences = readPreferences();
    delete preferences[key][id];
    writePreferences(preferences);
    return getMostSelected(key);
  }

  window.SpaceTimerPreferences = {
    MAX_FAVORITES,
    getFavoriteCars,
    getFavoriteDestinations,
    recordCarSelection: id => recordSelection('carSelections', id),
    recordDestinationSelection: id => recordSelection('destinationSelections', id),
    removeFavoriteCar: id => removeFavorite('carSelections', id),
    removeFavoriteDestination: id => removeFavorite('destinationSelections', id)
  };
})();