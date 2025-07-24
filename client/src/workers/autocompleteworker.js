import Fuse from 'fuse.js';

let fuse = null;
onmessage = function (e) {
  const { type, payload } = e.data;

  // instantiates Fuse
  if (type === 'init') {
    fuse = new Fuse(payload, {
      keys: ['term'],
      threshold: 0.3,
      shouldSort: true,
    });
  }

  // runs Fuse fuzzy search on payload and returns results
  if (type === 'search' && fuse) {
    const results = fuse.search(payload);
    self.postMessage({query: payload, results: results.map(r => r.item).slice(0, 8)});
  }
};