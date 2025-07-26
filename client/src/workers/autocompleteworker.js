import Fuse from 'fuse.js';

// Detect environment
let postMessageFunc;
let onMessageFunc;

const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

if (isNode) {
  // Node.js (Jest / worker_threads)
  const { parentPort } = await import('worker_threads');
  postMessageFunc = parentPort.postMessage.bind(parentPort);
  onMessageFunc = (handler) => {
    parentPort.on('message', handler);
  };
} else {
  // Browser Worker
  postMessageFunc = self.postMessage.bind(self);
  onMessageFunc = (handler) => {
    self.onmessage = (e) => handler(e.data);
  };
}

let fuse = null;

onMessageFunc((data) => {
  const { type, payload } = data;

  // instantiates Fuse
  if (type === 'init') {
    fuse = new Fuse(payload, {
      keys: ['term'],
      threshold: 0.3,
      shouldSort: true,
    });
    return;
  }

  if (type === 'search' && fuse) {
    const results = fuse.search(payload.trim());
    postMessageFunc({
      query: payload,
      results: results.map((r) => r.item).slice(0, 8),
    });
  }
});