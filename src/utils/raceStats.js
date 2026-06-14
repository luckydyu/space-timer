(() => {
  function sumLapRecords(records) {
    return records.reduce((acc, curr) => acc + curr, 0);
  }

  function formatTime(ms) {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hundredths = Math.floor((Math.max(0, ms) % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  }

  function getLapRank(records, time) {
    return 1 + records.filter(record => record < time).length;
  }

  function getRaceSummary(records) {
    const totalTime = sumLapRecords(records);
    const minTime = Math.min(...records);
    const avgTime = Math.floor(totalTime / records.length);

    return {
      totalTime,
      minTime,
      avgTime
    };
  }

  window.SpaceTimerRaceStats = {
    sumLapRecords,
    formatTime,
    getLapRank,
    getRaceSummary
  };
})();
