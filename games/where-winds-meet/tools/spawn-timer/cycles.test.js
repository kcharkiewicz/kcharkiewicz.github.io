// cycles.test.js — node:test coverage for pure cycle/deadline helpers
// Run: node --test games/where-winds-meet/tools/spawn-timer/cycles.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cycleLabel,
  resumeDeadline,
  isLastCycle,
  missedCycles,
  parseRepeat
} from './spawn-timer.js';

// ── cycleLabel ────────────────────────────────────────────────────────────────

test('cycleLabel: first cycle of 5', () => {
  assert.equal(cycleLabel(0, 5, false), 'Cycle 1 / 5');
});

test('cycleLabel: second cycle of 5', () => {
  assert.equal(cycleLabel(1, 5, false), 'Cycle 2 / 5');
});

test('cycleLabel: last cycle of 5', () => {
  assert.equal(cycleLabel(4, 5, false), 'Cycle 5 / 5');
});

test('cycleLabel: first cycle unlimited', () => {
  assert.equal(cycleLabel(0, 1, true), 'Cycle 1 / ∞');
});

test('cycleLabel: 4th cycle unlimited', () => {
  assert.equal(cycleLabel(3, 1, true), 'Cycle 4 / ∞');
});

test('cycleLabel: uses ∞ character (not "Inf" or "infinity")', () => {
  assert.equal(cycleLabel(0, 1, true), 'Cycle 1 / ∞');
});

// ── resumeDeadline ────────────────────────────────────────────────────────────

test('resumeDeadline: shifts deadline forward by pause duration', () => {
  // paused at 4000, resumed at 9000 → pause duration = 5000
  // cycleEnd 10000 shifts to 15000
  assert.equal(resumeDeadline(10000, 4000, 9000), 15000);
});

test('resumeDeadline: zero pause duration (immediate resume)', () => {
  // paused and resumed at same moment
  assert.equal(resumeDeadline(10000, 5000, 5000), 10000);
});

test('resumeDeadline: large pause duration', () => {
  // paused at 1000, resumed at 61000 → pause = 60000ms (1 min)
  assert.equal(resumeDeadline(30000, 1000, 61000), 90000);
});

// ── isLastCycle ───────────────────────────────────────────────────────────────

test('isLastCycle: last cycle of 5 (index 4)', () => {
  assert.equal(isLastCycle(4, 5, false), true);
});

test('isLastCycle: not last (first of 5)', () => {
  assert.equal(isLastCycle(0, 5, false), false);
});

test('isLastCycle: middle of 5', () => {
  assert.equal(isLastCycle(2, 5, false), false);
});

test('isLastCycle: unlimited is never last', () => {
  assert.equal(isLastCycle(99, 5, true), false);
});

test('isLastCycle: unlimited at index 0 is never last', () => {
  assert.equal(isLastCycle(0, 1, true), false);
});

test('isLastCycle: single cycle (index 0, total 1)', () => {
  assert.equal(isLastCycle(0, 1, false), true);
});

// ── missedCycles ──────────────────────────────────────────────────────────────

test('missedCycles: 4 missed (250s elapsed, 60s cycle)', () => {
  assert.equal(missedCycles(250000, 60000), 4);
});

test('missedCycles: 0 missed (30s elapsed, 60s cycle)', () => {
  assert.equal(missedCycles(30000, 60000), 0);
});

test('missedCycles: exactly 1 cycle elapsed (60s / 60s)', () => {
  assert.equal(missedCycles(60000, 60000), 1);
});

test('missedCycles: floors partial cycles', () => {
  // 90s elapsed / 60s cycle = 1.5 → floor = 1
  assert.equal(missedCycles(90000, 60000), 1);
});

test('missedCycles: zero duration returns 0 (guard)', () => {
  // durationMs=0 would cause divide-by-zero; must return 0
  assert.equal(missedCycles(100000, 0), 0);
});

// ── parseRepeat ───────────────────────────────────────────────────────────────

test('parseRepeat: valid count 5', () => {
  assert.equal(parseRepeat('5', false), 5);
});

test('parseRepeat: valid count 1', () => {
  assert.equal(parseRepeat('1', false), 1);
});

test('parseRepeat: 0 is invalid (null)', () => {
  assert.equal(parseRepeat('0', false), null);
});

test('parseRepeat: empty string is invalid (null)', () => {
  assert.equal(parseRepeat('', false), null);
});

test('parseRepeat: non-integer string is invalid (null)', () => {
  assert.equal(parseRepeat('x', false), null);
});

test('parseRepeat: negative is invalid (null)', () => {
  assert.equal(parseRepeat('-1', false), null);
});

test('parseRepeat: decimal is invalid (null)', () => {
  assert.equal(parseRepeat('2.5', false), null);
});

test('parseRepeat: unlimited checkbox returns { unlimited: true }', () => {
  const result = parseRepeat('5', true);
  assert.deepEqual(result, { unlimited: true });
});

test('parseRepeat: unlimited checkbox with empty value still returns { unlimited: true }', () => {
  const result = parseRepeat('', true);
  assert.deepEqual(result, { unlimited: true });
});
