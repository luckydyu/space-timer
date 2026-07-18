(() => {
  let state = null;
  let dom = null;
  let raceStats = null;
  let setupView = null;
  let kitanPlan = null;

  function init(options) {
    state = options.state;
    dom = options.dom;
    raceStats = options.raceStats;
    setupView = options.setupView;
    kitanPlan = options.kitanPlan;
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

  function getKitanLapLabel(index) {
    const startIndex = state.kitanMissionStartIndex + index;
    return kitanPlan.formatRange(startIndex, 1);
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

  function updateUndoButton() {
    const button = byId('undo-last-lap-button');
    if (!button) return;

    const canUndo = state.appState === 'LAP_WAITING' && state.lapRecords.length > 0;
    button.classList.toggle('hidden', !canUndo);
  }

  function showMissionReadyScreen() {
    byId('screen-setup').classList.add('hidden');
    byId('screen-countdown').classList.add('hidden');
    byId('screen-result').classList.add('hidden');
    byId('screen-running').classList.remove('hidden');
    byId('running-total-time').textContent = '00:00.00';
  }

  function showSetupScreen() {
    byId('screen-countdown').classList.add('hidden');
    byId('screen-running').classList.add('hidden');
    byId('screen-result').classList.add('hidden');
    byId('screen-setup').classList.remove('hidden');
  }

  function showCountdownScreen() {
    byId('screen-setup').classList.add('hidden');
    byId('screen-countdown').classList.remove('hidden');
  }

  function setCountdownText(text) {
    byId('countdown-text').textContent = text;
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

  function showRaceScreen() {
    byId('screen-countdown').classList.add('hidden');
    byId('screen-running').classList.remove('hidden');
  }

  function resetTrackForLap() {
    const carWrapper = byId('track-car-wrapper');
    const nitro = byId('nitro-overlay');
    carWrapper.style.transition = 'none';
    carWrapper.style.left = '16px';
    nitro.classList.add('hidden');
    setupView.resetDestinationTarget();
  }

  function resetTimerDisplay() {
    byId('timer-display').textContent = '00:00';
    byId('timer-ms').textContent = '.00';
  }

  function prepareLap() {
    resetTimerDisplay();
    resetTrackForLap();
    updateLapDashboard();
    updateMainActionButton();
  }

  function updateLapTimer() {
    const carWrapper = byId('track-car-wrapper');
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
  }

  function startLapCompletionAnimation() {
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
  }

  function endLapCompletionAnimation() {
    byId('main-container').classList.remove('shake-view');
  }

  function updateTotalTimeDisplay() {
    const activeElapsed = state.appState === 'FOCUS' ? state.currentLapElapsed : 0;
    byId('running-total-time').textContent = formatTime(state.totalElapsedMs + activeElapsed);
  }

  function updateLapDashboard() {
    updateUndoButton();
    byId('running-lap-indicator').textContent =
      `MISSION ${state.currentLap} / ${state.targetLaps} · ${getKitanLapLabel(state.currentLap - 1)}`;
    const list = byId('lap-records-list');
    list.innerHTML = '';
    for (let i = 0; i < state.targetLaps; i++) {
      const isRecorded = i < state.lapRecords.length;
      const isCurrent = i === (state.currentLap - 1);
      const rank = isRecorded ? getLapRank(state.lapRecords[i]) : null;
      list.insertAdjacentHTML('beforeend', `
        <div class="flex items-center justify-between p-3 rounded-xl border-2 ${isRecorded ? 'border-emerald-500 bg-emerald-950/30' : isCurrent ? 'border-indigo-500 bg-indigo-500/10 animate-pulse' : 'border-slate-700 bg-slate-900/40'} transition-all text-sm md:text-base">
          <span class="game-font ${isRecorded ? 'text-emerald-300' : isCurrent ? 'text-indigo-300' : 'text-slate-400'}">#${i + 1} ${getKitanLapLabel(i)}</span>
          <div class="flex items-center gap-2">
            ${isRecorded ? `<span class="game-font text-xs md:text-sm px-2 py-1 rounded-lg bg-indigo-900/80 text-indigo-100 border border-indigo-500">${rank}등</span>` : ''}
            <span class="game-font font-bold ${isRecorded ? 'text-white' : 'text-slate-500'}">${isRecorded ? formatTime(state.lapRecords[i]) : isCurrent ? (state.appState === 'LAP_WAITING' ? '출발 대기 중' : '비행 중...') : '대기 중'}🏁</span>
            ${isRecorded ? `<button type="button" data-delete-lap-index="${i}" class="game-font text-xs md:text-sm px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-700 text-slate-300 hover:text-white border border-slate-600 hover:border-rose-400 transition-colors" aria-label="${i + 1}번째 기록 삭제">삭제</button>` : ''}
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

  window.SpaceTimerRaceView = {
    init,
    updateMockControls,
    updateMainActionButton,
    updateUndoButton,
    showMissionReadyScreen,
    showSetupScreen,
    showCountdownScreen,
    setCountdownText,
    resetLights,
    setLight,
    showRaceScreen,
    resetTrackForLap,
    prepareLap,
    updateLapTimer,
    startLapCompletionAnimation,
    endLapCompletionAnimation,
    updateTotalTimeDisplay,
    updateLapDashboard
  };
})();
