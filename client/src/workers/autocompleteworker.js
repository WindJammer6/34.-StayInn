import Fuse from 'fuse.js';

let fuse = null;

//init fuse.js index
export function init(destinations) {
  fuse = new Fuse(destinations, {
    keys: ['term', 'lat', 'lng', 'state', 'type', 'uid'], //enable multi field searching here
    threshold: 0.3,
    ignoreLocation: true,   // enable substring match anywhere
    minMatchCharLength: 1,  
    shouldSort: true,
  });
}


//Perform search in Fuse index, with prioritisation rules
export function search(query) {
  if (!fuse) return [];
  const trimmed = query.trim();
  if (!trimmed) return [];

  let results = fuse.search(trimmed).map(r => r.item);

  const normalizedQuery = trimmed.toLowerCase();
  const queryNum = parseFloat(trimmed);

  //prioritise these fields for exact match
  const searchFields = ['uid', 'term', 'lat', 'lng'];

  const exactMatchIndex = results.findIndex(dest =>
    searchFields.some(field => {
      if (dest[field] == null) return false;
      if (field === 'lat' || field === 'lng') {
        if (isNaN(queryNum)) return false;
        return Math.abs(dest[field] - queryNum) < 1e-5;
      } else {
        return String(dest[field]).toLowerCase() === normalizedQuery;
      }
    })
  );

  if (exactMatchIndex > 0) {
    const [exactMatch] = results.splice(exactMatchIndex, 1);
    results.unshift(exactMatch);
  }

  //limit after reordering show to 8 max
  return results.slice(0, 8);
}


let postMessageFunc;
let onMessageFunc;

const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

if (isNode) {
  //node.js worker_threads
  const { parentPort } = await import('worker_threads');
  postMessageFunc = parentPort ? parentPort.postMessage.bind(parentPort) : () => {};
  onMessageFunc = (handler) => {
    if (parentPort) parentPort.on('message', handler);
  };
} else {
  //browser Web Worker
  postMessageFunc = self.postMessage.bind(self);
  onMessageFunc = (handler) => {
    self.onmessage = (e) => handler(e.data);
  };
}

//hook up to worker messages if running in worker context
if (typeof onMessageFunc === 'function') {
  onMessageFunc((data) => {
    const { type, payload } = data;

    if (type === 'init') {
      init(payload);
      return;
    }

    if (type === 'search') {
      const results = search(payload);
      postMessageFunc({ query: payload, results });
    }
  });
}
