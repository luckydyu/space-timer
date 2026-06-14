(() => {
  let state = null;
  let dom = null;
  let raceStats = null;
  let setupView = null;
  let audio = null;
  let speech = null;
  let effects = null;

  function init(options) {
    state = options.state;
    dom = options.dom;
    raceStats = options.raceStats;
    setupView = options.setupView;
    audio = options.audio;
    speech = options.speech;
    effects = options.effects;
  }

  function byId(id) {
    return dom.byId(id);
  }

  function formatTime(ms) {
    return raceStats.formatTime(ms);
  }

  function getLapRank(time) {
    return raceStats.getLapRank(state.lapRecords, time);
  }

  function updateMockControls() {
    const startBtn = byId('mock-voice-start');
    const finishBtn = byId('mock-voice-finish');
    if (!startBtn || !finishBtn) return;

    if (state.appState === 'SETUP' || state.appState === 'LAP_WAITING') {
      startBtn.classList.remove('opacity-40', 'cursor-not-allowed');
      startBtn.disabled = false;
      finishBtn.classList.add('opacity-40', 'cursor-not-allowed');
      finishBtn.disabled = true;
    } else if (state.appState === 'FOCUS') {
      startBtn.classList.add('opacity-40', 'cursor-not-allowed');
      startBtn.disabled = true;
      finishBtn.classList.remove('opacity-40', 'cursor-not-allowed');
      finishBtn.disabled = false;
    } else {
      startBtn.classList.add('opacity-40', 'cursor-not-allowed');
      startBtn.disabled = true;
      finishBtn.classList.add('opacity-40', 'cursor-not-allowed');
      finishBtn.disabled = true;
    }
  }

  function updateMainActionButton() {
    const btn = byId('main-action-button');
    if (!btn) return;

    const baseClass = 'w-full game-font text-xl md:text-2xl py-5 md:py-6 rounded-3xl border-b-8 active:transform active:translate-y-2 shadow-2xl transition-all relative overflow-hidden group ';

    if (state.appState === 'FOCUS') {
      btn.className = baseClass + 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border-red-950';
      btn.innerHTML = `
        <div class="absolute inset-0 bg-white/10 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        ✏️ 끝/스탑/멈춰/완료/도착/풀었 또는 터치!
      `;
    } else if (state.appState === 'LAP_WAITING') {
      btn.className = baseClass + 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-950 animate-pulse';
      btn.innerHTML = `
        <div class="absolute inset-0 bg-white/10 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        🚀 시작/스타트/시작해/출발/가자 또는 터치!
      `;
    } else if (state.appState === 'ANIMATING') {
      btn.className = baseClass + 'bg-slate-700 text-slate-400 border-slate-900 cursor-not-allowed';
      btn.innerHTML = '✨ 초광속 우주 비행 중... ✨';
    }
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
    updateMockControls();

    state.currentLap = 1;
    state.lapRecords = [];
    state.totalElapsedMs = 0;
    state.currentLapElapsed = 0;
    if (state.timerInterval) clearInterval(state.timerInterval);

    byId('screen-setup').classList.add('hidden');
    byId('screen-countdown').classList.add('hidden');
    byId('screen-result').classList.add('hidden');
    byId('screen-running').classList.remove('hidden');
    byId('running-total-time').textContent = '00:00.00';

    effects.createParticles();
    prepareNextLap();

    if (speech.isSpeechRecognitionActive()) {
      speech.startRealSpeechEngine();
    }
  }

  function startCountdown() {
    state.appState = 'COUNTDOWN';
    updateMockControls();

    byId('screen-setup').classList.add('hidden');
    byId('screen-countdown').classList.remove('hidden');

    let count = 3;
    byId('countdown-text').textContent = count;
    resetLights();
    setLight('red');
    audio.beepLow();

    const countdownInterval = setInterval(() => {
      count--;
      if (count === 2) {
        setLight('yellow');
        audio.beepLow();
      } else if (count === 1) {
        setLight('green');
        audio.beepLow();
      } else if (count === 0) {
        clearInterval(countdownInterval);
        audio.beepHigh();
        byId('countdown-text').textContent = 'GO!';
        setTimeout(startRace, 600);
      }
      if (count > 0) {
        byId('countdown-text').textContent = count;
      }
    }, 1000);
  }

  function resetLights() {
    ['red', 'yellow', 'green'].forEach(color => {
      const bg = color === 'green' ? 'emerald' : color;
      byId(`light-${color}`).className = `w-16 h-16 md:w-20 md:h-20 rounded-full bg-${bg}-950 border-4 border-slate-700 transition-all`;
    });
  }

  function setLight(color) {
    const light = byId(`light-${color}`);
    const base = color === 'green' ? 'emerald' : color;
    light.className = `w-16 h-16 md:w-20 md:h-20 rounded-full bg-${base}-500 border-4 border-${base}-300 shadow-[0_0_30px_#${color === 'red' ? 'ef4444' : color === 'yellow' ? 'eab308' : '34d399'}] transition-all`;
  }

  function startRace() {
    state.appState = 'FOCUS';
    updateMockControls();
    updateMainActionButton();

    state.currentLap = 1;
    state.lapRecords = [];
    state.totalElapsedMs = 0;

    byId('screen-countdown').classList.add('hidden');
    byId('screen-running').classList.remove('hidden');

    effects.createParticles();
    startLapTimer();
  }

  function startLapTimer() {
    state.lapStartTime = Date.now();

    const carWrapper = byId('track-car-wrapper');
    const nitro = byId('nitro-overlay');
    carWrapper.style.transition = 'none';
    carWrapper.style.left = '16px';
    nitro.classList.add('hidden');
    setupView.resetDestinationTarget();

    updateLapDashboard();

    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      state.currentLapElapsed = Date.now() - state.lapStartTime;

      const totalSecs = Math.floor(state.currentLapElapsed / 1000);
      const minutes = Math.floor(totalSecs / 60);
      const seconds = totalSecs % 60;
      const msFraction = String(Math.floor((state.currentLapElapsed % 1000) / 10)).padStart(2, '0');

      byId('timer-display').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      byId('timer-ms').textContent = `.${msFraction}`;
      byId('running-total-time').textContent = formatTime(state.totalElapsedMs + state.currentLapElapsed);

      const targetStandardMs = 300000;
      const progress = Math.min((state.currentLapElapsed / targetStandardMs) * 85, 85);
      carWrapper.style.transition = 'left 0.1s linear';
      carWrapper.style.left = `calc(${progress}% + 16px)`;
    }, 100);
  }

  function startNextLap() {
    if (state.appState !== 'LAP_WAITING') return;
    state.appState = 'FOCUS';
    updateMockControls();
    updateMainActionButton();
    startLapTimer();
  }

  function completeLap() {
    if (state.appState !== 'FOCUS') return;
    clearInterval(state.timerInterval);

    state.appState = 'ANIMATING';
    updateMockControls();
    updateMainActionButton();

    audio.nitro();
    const carWrapper = byId('track-car-wrapper');
    const nitro = byId('nitro-overlay');
    const destinationTarget = byId('track-destination-target');
    const mainContainer = byId('main-container');
    setupView.resetDestinationTarget();

    nitro.classList.remove('hidden');
    mainContainer.classList.add('shake-view');

    carWrapper.style.transition = 'left 0.35s cubic-bezier(0.15, 1, 0.3, 1)';
    carWrapper.style.left = 'calc(100% - 150px)';
    setTimeout(() => {
      destinationTarget.classList.add('destination-hit');
    }, 340);
    setTimeout(() => {
      carWrapper.style.transition = 'left 0.38s cubic-bezier(0.15, 1, 0.3, 1)';
      carWrapper.style.left = 'calc(100% + 100px)';
    }, 430);

    state.lapRecords.push(state.currentLapElapsed);
    recalculateTotalElapsed();

    setTimeout(() => {
      mainContainer.classList.remove('shake-view');
      audio.success();
      speech.speakMissionTime(state.currentLapElapsed);

      if (state.currentLap < state.targetLaps) {
        state.currentLap++;
        state.appState = 'LAP_WAITING';
        updateMockControls();
        prepareNextLap();
      } else {
        finishRace();
      }
    }, 1050);
  }

  function prepareNextLap() {
    byId('timer-display').textContent = '00:00';
    byId('timer-ms').textContent = '.00';

    const carWrapper = byId('track-car-wrapper');
    const nitro = byId('nitro-overlay');
    carWrapper.style.transition = 'none';
    carWrapper.style.left = '16px';
    nitro.classList.add('hidden');
    setupView.resetDestinationTarget();

    updateLapDashboard();
    updateMainActionButton();
  }

  function finishRace() {
    state.appState = 'RESULT';
    updateMockControls();

    speech.stopRealSpeechEngine();

    byId('screen-running').classList.add('hidden');
    byId('screen-result').classList.remove('hidden');

    const { totalTime, minTime, avgTime } = raceStats.getRaceSummary(state.lapRecords);

    byId('result-total-time').textContent = formatTime(totalTime);
    byId('result-avg-lap').textContent = formatTime(avgTime);
    byId('result-best-lap').textContent = formatTime(minTime);

    const details = byId('final-lap-details');
    details.innerHTML = '';
    state.lapRecords.forEach((time, index) => {
      const isBest = time === minTime;
      const rank = getLapRank(time);
      details.insertAdjacentHTML('beforeend', `
        <div class="flex justify-between items-center py-2 border-b border-slate-900 text-xs md:text-sm">
          <span class="text-slate-400 game-font">🚀 ${index + 1}장째 학습지 완주</span>
          <div class="flex items-center gap-2">
            ${isBest ? '<span class="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded game-font animate-pulse">초광속 비행기록 ⚡</span>' : ''}
            <span class="text-[9px] bg-indigo-700 text-indigo-100 px-1.5 py-0.5 rounded game-font">${rank}등</span>
            <span class="font-bold text-slate-100 game-font">${formatTime(time)}</span>
          </div>
        </div>
      `);
    });

    audio.fanfare();
    effects.startConfetti();
  }

  function restartApp() {
    state.appState = 'SETUP';
    updateMockControls();

    if (speech.isSpeechRecognitionActive()) {
      speech.setSpeechRecognitionWaitingStatus();
    }

    byId('screen-result').classList.add('hidden');
    byId('screen-setup').classList.remove('hidden');
    effects.stopConfetti();
  }

  function recalculateTotalElapsed() {
    state.totalElapsedMs = raceStats.sumLapRecords(state.lapRecords);
  }

  function updateTotalTimeDisplay() {
    const activeElapsed = state.appState === 'FOCUS' ? state.currentLapElapsed : 0;
    byId('running-total-time').textContent = formatTime(state.totalElapsedMs + activeElapsed);
  }

  function deleteRecordedLap(index) {
    if (index < 0 || index >= state.lapRecords.length || state.appState === 'ANIMATING') return;
    state.lapRecords.splice(index, 1);
    recalculateTotalElapsed();
    state.currentLap = Math.min(state.targetLaps, state.lapRecords.length + 1);
    updateTotalTimeDisplay();
    updateLapDashboard();
    audio.click();
  }

  function updateLapDashboard() {
    byId('running-lap-indicator').textContent = `MISSION ${state.currentLap} / ${state.targetLaps}`;
    const list = byId('lap-records-list');
    list.innerHTML = '';
    for (let i = 0; i < state.targetLaps; i++) {
      const isRecorded = i < state.lapRecords.length;
      const isCurrent = i === (state.currentLap - 1);
      const rank = isRecorded ? getLapRank(state.lapRecords[i]) : null;
      list.insertAdjacentHTML('beforeend', `
        <div class="flex items-center justify-between p-3 rounded-xl border-2 ${isRecorded ? 'border-emerald-500 bg-emerald-950/30' : isCurrent ? 'border-indigo-500 bg-indigo-500/10 animate-pulse' : 'border-slate-700 bg-slate-900/40'} transition-all text-xs md:text-sm">
          <span class="game-font ${isRecorded ? 'text-emerald-300' : isCurrent ? 'text-indigo-300' : 'text-slate-400'}">#${i + 1}번째 장</span>
          <div class="flex items-center gap-2">
            ${isRecorded ? `<span class="game-font text-[10px] md:text-xs px-2 py-1 rounded-lg bg-indigo-900/80 text-indigo-100 border border-indigo-500">${rank}등</span>` : ''}
            <span class="game-font font-bold ${isRecorded ? 'text-white' : 'text-slate-500'}">${isRecorded ? formatTime(state.lapRecords[i]) : isCurrent ? (state.appState === 'LAP_WAITING' ? '출발 대기 중' : '비행 중...') : '대기 중'}🏁</span>
            ${isRecorded ? `<button type="button" data-delete-lap-index="${i}" class="game-font text-[10px] md:text-xs px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-700 text-slate-300 hover:text-white border border-slate-600 hover:border-rose-400 transition-colors" aria-label="${i + 1}번째 기록 삭제">삭제</button>` : ''}
          </div>
        </div>
      `);
    }

    const currentActiveNode = list.children[state.currentLap - 1];
    if (currentActiveNode) {
      const minScrollToShowCurrent =
        currentActiveNode.offsetTop + currentActiveNode.offsetHeight - list.clientHeight;
      list.scrollTop = Math.max(0, minScrollToShowCurrent);
    }
  }

  window.SpaceTimerRaceController = {
    init,
    handleMainAction,
    enterMissionReady,
    startCountdown,
    startNextLap,
    completeLap,
    restartApp,
    deleteRecordedLap
  };
})();
