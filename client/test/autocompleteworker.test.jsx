const destinationsData = require('../src/assets/destinations.json');  // assuming the destinations file is in src/assets
const { Worker } = require('worker_threads');
const path = require('path');

describe("autocompleteworkertest", () => {
    let result = [];
    let worker;

    beforeAll(async () => {
        // initialise Web Worker
        var workerPath = path.resolve(__dirname, '../src/workers/autocompleteWorker.js');
        worker = new Worker(workerPath, {
            eval: false,
            type: 'module', // treat JS file as ES module
        });
        worker.postMessage({
            type: "init",
            payload: destinationsData,
        });
        // worker.onmessage = (e) => {
        //     result = e.data.results;
        // }
    })

    function sendToWorker(worker, payload) {
        return new Promise((resolve) => {
            worker.once('message', (msg) => {
                resolve(msg.results);
            });
            worker.postMessage(payload);
        });
    }
    // Empty query should return empty suggestions
    test("Empty string as payload", async () => {
        const result = await sendToWorker(worker, {
            type: "search", 
            payload: "",
        });
        expect(result).toEqual([]); 
    });
    // Query with only spaces should return empty suggestions
    test("Spaces-only payload", async () => {
        const result = await sendToWorker(worker, {
            type: "search", 
            payload: " ",
        });
        expect(result).toEqual([]); 
    });
    // Query with poor match with any destination should return empty suggestions
    test ("'qwerty' as payload'", async () => {
        const result = await sendToWorker(worker, {
            type: "search", 
            payload: "qwerty",
        });
        expect(result).toEqual([]); 
    });
    // Suggestions should include exact matches with payload
    test("'Singapore' string as payload", async () => {
        const result = await sendToWorker(worker, {
            type: "search", 
            payload: "Singapore",
        });
        expect(result.some(r => r.term.includes("Singapore"))).toBe(true); 
    });
    // Suggestions should include "Singapore" despite minor typo
    test ("'Sogapire' as payload'", async () => {
        const result = await sendToWorker(worker, {
            type: "search", 
            payload: "Songapire",
        });
        expect(result.some(r => r.term.includes("Singapore"))).toBe(true); // typo should return empty suggestions
    });

    afterAll(() => {
        worker.terminate();
    });
})
