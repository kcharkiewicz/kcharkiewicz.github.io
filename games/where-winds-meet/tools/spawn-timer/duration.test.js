// duration.test.js — node:test coverage for parseDuration and formatRemaining
// Run: node --test games/where-winds-meet/tools/spawn-timer/duration.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration, formatRemaining } from './spawn-timer.js';

// ── parseDuration ─────────────────────────────────────────────────────────────

test('parseDuration: "3:00" → 180000', () => {
  assert.strictEqual(parseDuration('3:00'), 180000);
});

test('parseDuration: "0:30" → 30000', () => {
  assert.strictEqual(parseDuration('0:30'), 30000);
});

test('parseDuration: "180" → 180000', () => {
  assert.strictEqual(parseDuration('180'), 180000);
});

test('parseDuration: "1" → 1000', () => {
  assert.strictEqual(parseDuration('1'), 1000);
});

test('parseDuration: "" (empty string) → null', () => {
  assert.strictEqual(parseDuration(''), null);
});

test('parseDuration: "   " (whitespace) → null', () => {
  assert.strictEqual(parseDuration('   '), null);
});

test('parseDuration: "3:75" (seconds >= 60) → null', () => {
  assert.strictEqual(parseDuration('3:75'), null);
});

test('parseDuration: "abc" (non-numeric) → null', () => {
  assert.strictEqual(parseDuration('abc'), null);
});

test('parseDuration: "3:0" (single-digit seconds, not MM:SS) → null', () => {
  assert.strictEqual(parseDuration('3:0'), null);
});

test('parseDuration: "3:000" (three-digit seconds, not MM:SS) → null', () => {
  assert.strictEqual(parseDuration('3:000'), null);
});

test('parseDuration: "0" (zero) → null', () => {
  assert.strictEqual(parseDuration('0'), null);
});

test('parseDuration: "-5" (negative) → null', () => {
  assert.strictEqual(parseDuration('-5'), null);
});

// Extra edge cases
test('parseDuration: "0:00" (zero duration in MM:SS) → null', () => {
  assert.strictEqual(parseDuration('0:00'), null);
});

test('parseDuration: "1:59" (boundary seconds) → 119000', () => {
  assert.strictEqual(parseDuration('1:59'), 119000);
});

test('parseDuration: "1:60" (seconds == 60 is invalid) → null', () => {
  assert.strictEqual(parseDuration('1:60'), null);
});

test('parseDuration: "999:59" (max MM) → 59999000', () => {
  assert.strictEqual(parseDuration('999:59'), (999 * 60 + 59) * 1000);
});

// ── formatRemaining ───────────────────────────────────────────────────────────

test('formatRemaining: 180000 → "03:00"', () => {
  assert.strictEqual(formatRemaining(180000), '03:00');
});

test('formatRemaining: 30000 → "00:30"', () => {
  assert.strictEqual(formatRemaining(30000), '00:30');
});

test('formatRemaining: 5500 → "00:06" (Math.ceil)', () => {
  assert.strictEqual(formatRemaining(5500), '00:06');
});

test('formatRemaining: 0 → "00:00"', () => {
  assert.strictEqual(formatRemaining(0), '00:00');
});

test('formatRemaining: -200 → "00:00" (clamped at 0)', () => {
  assert.strictEqual(formatRemaining(-200), '00:00');
});

test('formatRemaining: 1000 → "00:01"', () => {
  assert.strictEqual(formatRemaining(1000), '00:01');
});

test('formatRemaining: 60000 → "01:00"', () => {
  assert.strictEqual(formatRemaining(60000), '01:00');
});

test('formatRemaining: 3661000 → "61:01" (minutes > 59 allowed)', () => {
  assert.strictEqual(formatRemaining(3661000), '61:01');
});

test('formatRemaining: 500 → "00:01" (< 1 second rounds up to 1)', () => {
  assert.strictEqual(formatRemaining(500), '00:01');
});

test('formatRemaining: 1 → "00:01" (1ms rounds up to 1 second)', () => {
  assert.strictEqual(formatRemaining(1), '00:01');
});
