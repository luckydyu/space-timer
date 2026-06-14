(() => {
  let state = null;
  let dom = null;
  let raceStats = null;
  let kitanPlan = null;

  function init(options) {
    state = options.state;
    dom = options.dom;
    raceStats = options.raceStats;
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

  function showResultScreen() {
    byId('screen-running').classList.add('hidden');
    byId('screen-result').classList.remove('hidden');
  }

  function showSetupScreen() {
    byId('screen-result').classList.add('hidden');
    byId('screen-setup').classList.remove('hidden');
  }

  function renderResults() {
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
          <span class="text-slate-400 game-font">🚀 ${kitanPlan.formatRange(state.kitanMissionStartIndex + index, 1)} 완주</span>
          <div class="flex items-center gap-2">
            ${isBest ? '<span class="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded game-font animate-pulse">초광속 비행기록 ⚡</span>' : ''}
            <span class="text-[9px] bg-indigo-700 text-indigo-100 px-1.5 py-0.5 rounded game-font">${rank}등</span>
            <span class="font-bold text-slate-100 game-font">${formatTime(time)}</span>
          </div>
        </div>
      `);
    });
  }

  window.SpaceTimerResultView = {
    init,
    showResultScreen,
    showSetupScreen,
    renderResults
  };
})();
