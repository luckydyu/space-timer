(() => {
  function bind(options) {
    const { dom, handlers } = options;

    dom.byId('mic-toggle-input')?.addEventListener('change', handlers.toggleSpeechRecognition);

    document.addEventListener('click', event => {
      const target = dom.closest(
        event.target,
        '[data-action], [data-lap-diff], [data-car-id], [data-destination-id], [data-delete-lap-index]'
      );
      if (!target) return;

      if (target.dataset.lapDiff !== undefined) {
        handlers.changeLaps(Number(target.dataset.lapDiff));
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

      if (target.dataset.deleteLapIndex !== undefined) {
        handlers.deleteRecordedLap(Number(target.dataset.deleteLapIndex));
        return;
      }

      const category = target.dataset.category;
      const actionHandlers = {
        'open-voice-help': handlers.openVoiceCommandHelp,
        'close-voice-help': handlers.closeVoiceCommandHelp,
        'randomize-mission': handlers.randomizeMissionSelection,
        'enter-mission-ready': handlers.enterMissionReady,
        'main-action': handlers.handleMainAction,
        'undo-last-lap': handlers.undoLastLap,
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
