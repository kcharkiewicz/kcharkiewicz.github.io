// timer.worker.js — Web Worker tick source for spawn-timer
// Owns: the setInterval that fires in background tabs without Chrome throttling.
// No DOM access, no AudioContext — pure message-passing only.
// Main thread sends { cmd: 'start', intervalMs: 100 } or { cmd: 'stop' }.
// Worker replies { type: 'tick' } on every interval.

let intervalId = null;

self.onmessage = function(e) {
  switch (e.data.cmd) {
    case 'start':
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        self.postMessage({ type: 'tick' });
      }, e.data.intervalMs || 100);
      break;
    case 'stop':
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      break;
  }
};
