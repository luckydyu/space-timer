(() => {
  function bind(options) {
    const { dom, handlers } = options;

    dom.byId('mic-toggle-input')?.addEventListener('change', handlers.toggleSpeechRecognition);
    document.addEventListener('change', event => {
      const target = dom.closest(event.target, '[data-kitan-field]');
      if (!target) return;
      handlers.updateKitanStart(target.dataset.kitanField, target.value);
    });

    document.addEventListener('click', event => {
      const target = dom.closest(
        event.target,
        '[data-action], [data-lap-diff], [data-kitan-page-diff], [data-kitan-step-diff], [data-car-id], [data-destination-id], [data-favorite-car-id], [data-favorite-destination-id], [data-remove-favorite-car-id], [data-remove-favorite-destination-id], [data-delete-lap-index]'
      );
      if (!target) return;

      if (target.dataset.lapDiff !== undefined) {
        handlers.changeLaps(Number(target.dataset.lapDiff));
        return;
      }

      if (target.dataset.kitanPageDiff !== undefined) {
        handlers.changeKitanPage(Number(target.dataset.kitanPageDiff));
        return;
      }

      if (target.dataset.kitanStepDiff) {
        const [field, diff] = target.dataset.kitanStepDiff.split(':');
        handlers.changeKitanStep(field, Number(diff));
        return;
      }

      if (target.dataset.carId) {
        handlers.selectCar(target.dataset.carId);
        return;
      }

      if (target.dataset.destinationId) {
        handlers.selectDestination(target.dataset.destinationId);
        return;
      }

      if (target.dataset.favoriteCarId) {
        handlers.toggleFavoriteCar(target.dataset.favoriteCarId);
        return;
      }

      if (target.dataset.favoriteDestinationId) {
        handlers.toggleFavoriteDestination(target.dataset.favoriteDestinationId);
        return;
      }

      if (target.dataset.removeFavoriteCarId) {
        handlers.removeFavoriteCar(target.dataset.removeFavoriteCarId);
        return;
      }

      if (target.dataset.removeFavoriteDestinationId) {
        handlers.removeFavoriteDestination(target.dataset.removeFavoriteDestinationId);
        return;
      }

      if (target.dataset.deleteLapIndex !== undefined) {
        handlers.deleteRecordedLap(Number(target.dataset.deleteLapIndex));
        return;
      }

      const category = target.dataset.category;
      const actionHandlers = {
        'open-voice-help': handlers.openVoiceCommandHelp,
        'close-voice-help': handlers.closeVoiceCommandHelp,
        'open-kitan-calendar': handlers.openKitanCalendar,
        'close-kitan-calendar': handlers.closeKitanCalendar,
        'open-mission-history': handlers.openMissionHistory,
        'close-mission-history': handlers.closeMissionHistory,
        'retry-final-lap': handlers.retryFinalLap,
        'confirm-finish-race': handlers.confirmFinishRace,
        'randomize-mission': handlers.randomizeMissionSelection,
        'enter-mission-ready': handlers.enterMissionReady,
        'main-action': handlers.handleMainAction,
        'undo-last-lap': handlers.undoLastLap,
        'go-home': handlers.restartApp,
        'restart-app': handlers.restartApp,
        selectCarCategory: () => handlers.selectCarCategory(category),
        selectDestinationCategory: () => handlers.selectDestinationCategory(category)
      };

      actionHandlers[target.dataset.action]?.();
    });
  }

  window.SpaceTimerEvents = {
    bind
  };
})();
