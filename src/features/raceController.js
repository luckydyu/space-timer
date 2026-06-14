(() => {
  let state = null;
  let raceStats = null;
  let raceView = null;
  let resultView = null;
  let audio = null;
  let speech = null;
  let effects = null;

  function init(options) {
    state = options.state;
    raceStats = options.raceStats;
    raceView = options.raceView;
    resultView = options.resultView;
    audio = options.audio;
    speech = options.speech;
    effects = options.effects;
  }

  function handleMainAction() {
    speech.primeUserAudio();
    if (state.appState === 'FOCUS') {
      completeLap();
    } else if (state.appState === 'LAP_WAITING') {
      audio.click();
      startNextLap();
    }
  }

  function enterMissionReady() {
    speech.primeUserAudio();
    state.appState = 'LAP_WAITING';
    raceView.updateMockControls();

    state.currentLap = 1;
    state.lapRecords = [];
    state.totalElapsedMs = 0;
    state.currentLapElapsed = 0;
    if (state.timerInterval) clearInterval(state.timerInterval);

    raceView.showMissionReadyScreen();
    effects.createParticles();
    prepareNextLap();

    if (speech.isSpeechRecognitionActive()) {
      speech.startRealSpeechEngine();
    }
  }

  function startCountdown() {
    state.appState = 'COUNTDOWN';
    raceView.updateMockControls();
    raceView.showCountdownScreen();

    let count = 3;
    raceView.setCountdownText(count);
    raceView.resetLights();
    raceView.setLight('red');
    audio.beepLow();

    const countdownInterval = setInterval(() => {
      count--;
      if (count === 2) {
        raceView.setLight('yellow');
        audio.beepLow();
      } else if (count === 1) {
        raceView.setLight('green');
        audio.beepLow();
      } else if (count === 0) {
        clearInterval(countdownInterval);
        audio.beepHigh();
        raceView.setCountdownText('GO!');
        setTimeout(startRace, 600);
      }
      if (count > 0) {
        raceView.setCountdownText(count);
      }
    }, 1000);
  }

  function startRace() {
    state.appState = 'FOCUS';
    raceView.updateMockControls();
    raceView.updateMainActionButton();

    state.currentLap = 1;
    state.lapRecords = [];
    state.totalElapsedMs = 0;

    raceView.showRaceScreen();
    effects.createParticles();
    startLapTimer();
  }

  function startLapTimer() {
    state.lapStartTime = Date.now() - state.currentLapElapsed;
    raceView.resetTrackForLap();
    raceView.updateLapDashboard();
    raceView.updateLapTimer();

    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.currentLapElapsed = Date.now() - state.lapStartTime;
      raceView.updateLapTimer();
    }, 100);
  }

  function startNextLap() {
    if (state.appState !== 'LAP_WAITING') return;
    state.appState = 'FOCUS';
    raceView.updateMockControls();
    raceView.updateMainActionButton();
    startLapTimer();
  }

  function completeLap() {
    if (state.appState !== 'FOCUS') return;
    clearInterval(state.timerInterval);

    state.appState = 'ANIMATING';
    raceView.updateMockControls();
    raceView.updateMainActionButton();

    audio.nitro();
    raceView.startLapCompletionAnimation();

    state.lapRecords.push(state.currentLapElapsed);
    recalculateTotalElapsed();

    setTimeout(() => {
      raceView.endLapCompletionAnimation();
      audio.success();
      speech.speakMissionTime(state.currentLapElapsed);

      if (state.currentLap < state.targetLaps) {
        state.currentLap++;
        state.appState = 'LAP_WAITING';
        raceView.updateMockControls();
        prepareNextLap();
      } else {
        finishRace();
      }
    }, 1050);
  }

  function prepareNextLap() {
    state.currentLapElapsed = 0;
    raceView.prepareLap();
  }

  function finishRace() {
    state.appState = 'RESULT';
    raceView.updateMockControls();
    speech.stopRealSpeechEngine();
    resultView.showResultScreen();
    resultView.renderResults();
    audio.fanfare();
    effects.startConfetti();
  }

  function restartApp() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.appState = 'SETUP';
    state.currentLapElapsed = 0;
    raceView.updateMockControls();
    speech.stopRealSpeechEngine();

    if (speech.isSpeechRecognitionActive()) {
      speech.setSpeechRecognitionWaitingStatus();
    }

    raceView.showSetupScreen();
    effects.stopConfetti();
  }

  function recalculateTotalElapsed() {
    state.totalElapsedMs = raceStats.sumLapRecords(state.lapRecords);
  }

  function deleteRecordedLap(index) {
    if (index < 0 || index >= state.lapRecords.length || state.appState === 'ANIMATING') return;
    state.lapRecords.splice(index, 1);
    recalculateTotalElapsed();
    state.currentLap = Math.min(state.targetLaps, state.lapRecords.length + 1);
    raceView.updateTotalTimeDisplay();
    raceView.updateLapDashboard();
    audio.click();
  }

  function undoLastLap() {
    if (state.appState !== 'LAP_WAITING' || state.lapRecords.length === 0) return;

    const restoredElapsed = state.lapRecords.pop();
    recalculateTotalElapsed();
    state.currentLap = state.lapRecords.length + 1;
    state.currentLapElapsed = restoredElapsed;

    raceView.resetTrackForLap();
    raceView.updateLapTimer();
    raceView.updateLapDashboard();
    raceView.updateMainActionButton();
    raceView.updateMockControls();
    audio.click();
  }

  window.SpaceTimerRaceController = {
    init,
    handleMainAction,
    enterMissionReady,
    startCountdown,
    startNextLap,
    completeLap,
    restartApp,
    deleteRecordedLap,
    undoLastLap
  };
})();
