import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadRaceStats() {
  const source = await readFile(new URL('../../src/utils/raceStats.js', import.meta.url), 'utf8');
  const context = {
    window: {}
  };

  vm.createContext(context);
  vm.runInContext(source, context);
  return context.window.SpaceTimerRaceStats;
}

test('formatTime renders minutes, seconds, and hundredths', async () => {
  const raceStats = await loadRaceStats();

  assert.equal(raceStats.formatTime(0), '00:00.00');
  assert.equal(raceStats.formatTime(999), '00:00.99');
  assert.equal(raceStats.formatTime(61005), '01:01.00');
  assert.equal(raceStats.formatTime(3599999), '59:59.99');
});

test('sumLapRecords returns the total elapsed time', async () => {
  const raceStats = await loadRaceStats();

  assert.equal(raceStats.sumLapRecords([]), 0);
  assert.equal(raceStats.sumLapRecords([1200, 3400, 5600]), 10200);
});

test('getLapRank ranks strictly faster lap records ahead of the target time', async () => {
  const raceStats = await loadRaceStats();
  const records = [5000, 3000, 5000, 8000];

  assert.equal(raceStats.getLapRank(records, 3000), 1);
  assert.equal(raceStats.getLapRank(records, 5000), 2);
  assert.equal(raceStats.getLapRank(records, 8000), 4);
});

test('getRaceSummary returns total, best, and floored average times', async () => {
  const raceStats = await loadRaceStats();
  const summary = raceStats.getRaceSummary([1200, 3400, 5601]);

  assert.equal(summary.totalTime, 10201);
  assert.equal(summary.minTime, 1200);
  assert.equal(summary.avgTime, 3400);
});
