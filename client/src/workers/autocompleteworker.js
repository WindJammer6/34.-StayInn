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
      keys: ['term', 'lat', 'lng', 'state', 'type', 'uid'], // <-- added for multi-field search
      threshold: 0.3,
      ignoreLocation: true,      // <-- enable substring matching anywhere in term
      minMatchCharLength: 1,     // <-- allow matching short terms
      shouldSort: true,
    });
    return;
  }


  if (type === 'search' && fuse) {
    const query = payload.trim();

    // Perform Fuse search as usual
    let results = fuse.search(query).map(r => r.item).slice(0, 8);

    const normalizedQuery = query.toLowerCase();
    const queryNum = parseFloat(query);

    // Fields where exact match applies (adjust as needed)
    const searchFields = ['uid', 'term', 'lat', 'lng', 'state', 'type'];

    // Try to find a destination with an exact field match to query
    const exactMatchIndex = results.findIndex(dest =>
      searchFields.some(field => {
        if (dest[field] == null) return false;

        if (field === 'lat' || field === 'lng') {
          if (isNaN(queryNum)) return false;
          // Compare lat/lng with numeric tolerance, e.g. 1e-5
          return Math.abs(dest[field] - queryNum) < 1e-5;
        } else {
          // String fields, compare normalized lowercase string
          const fieldValue = String(dest[field]).toLowerCase();
          return fieldValue === normalizedQuery;
        }
      })
    );

    if (exactMatchIndex > 0) {
      // Move exact match item to front
      const [exactMatch] = results.splice(exactMatchIndex, 1);
      results.unshift(exactMatch);
    }

    postMessageFunc({
      query,
      results,
    });
  }
});
