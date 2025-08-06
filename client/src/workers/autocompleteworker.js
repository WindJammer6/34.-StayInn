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
      ignoreLocation: true,   // <-- enable substring matching anywhere in term
      minMatchCharLength: 1,  // <-- allow matching short terms
      shouldSort: true,
    });
    return;
  }

  if (type === 'search' && fuse) {
    const query = payload.trim();

    let results = fuse.search(query).map(r => r.item);

    const normalizedQuery = query.toLowerCase();
    const queryNum = parseFloat(query);

    //prioritse which terms
    const searchFields = ['uid', 'term', 'lat', 'lng'];
    //'state', 'type'

    const exactMatchIndex = results.findIndex(dest =>
      searchFields.some(field => {
        if (dest[field] == null) return false;

        if (field === 'lat' || field === 'lng') {
          if (isNaN(queryNum)) return false;
          return Math.abs(dest[field] - queryNum) < 1e-5;
        } else {
          const fieldValue = String(dest[field]).toLowerCase();
          return fieldValue === normalizedQuery;
        }
      })
    );

    if (exactMatchIndex > 0) {
      const [exactMatch] = results.splice(exactMatchIndex, 1);
      results.unshift(exactMatch);
    }

    // Limit to top 8 AFTER reordering
    results = results.slice(0, 8);

    postMessageFunc({
      query,
      results,
    });
  }

});
