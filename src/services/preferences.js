(() => {
  const STORAGE_KEY = 'spaceTimerPreferences';
  const MAX_FAVORITES = 3;
  function createDefaultPreferences() {
    return {
      favoriteCars: [],
      favoriteDestinations: []
    };
  }

  function readPreferences() {
    try {
      const rawValue = window.localStorage.getItem(STORAGE_KEY);
      if (!rawValue) return createDefaultPreferences();
      const parsedValue = JSON.parse(rawValue);

      return {
        favoriteCars: Array.isArray(parsedValue.favoriteCars) ? parsedValue.favoriteCars.slice(0, MAX_FAVORITES) : [],
        favoriteDestinations: Array.isArray(parsedValue.favoriteDestinations)
          ? parsedValue.favoriteDestinations.slice(0, MAX_FAVORITES)
          : []
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

  function getFavoriteCars() {
    return readPreferences().favoriteCars;
  }

  function getFavoriteDestinations() {
    return readPreferences().favoriteDestinations;
  }

  function toggleFavorite(key, id) {
    const preferences = readPreferences();
    const favorites = preferences[key];
    const currentIndex = favorites.indexOf(id);

    if (currentIndex >= 0) {
      favorites.splice(currentIndex, 1);
    } else {
      favorites.unshift(id);
      favorites.splice(MAX_FAVORITES);
    }

    writePreferences(preferences);
    return favorites;
  }

  function toggleFavoriteCar(id) {
    return toggleFavorite('favoriteCars', id);
  }

  function toggleFavoriteDestination(id) {
    return toggleFavorite('favoriteDestinations', id);
  }

  window.SpaceTimerPreferences = {
    MAX_FAVORITES,
    getFavoriteCars,
    getFavoriteDestinations,
    toggleFavoriteCar,
    toggleFavoriteDestination
  };
})();
