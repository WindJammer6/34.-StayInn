import { describe, it, beforeEach, expect, vi } from "vitest";
import Fuse from "fuse.js";

// Mock Fuse so we control behavior
vi.mock("fuse.js");

import * as worker from "../src/workers/autocompleteworker.js";

describe("Autocomplete Worker - Backend Unit Tests", () => {
  let mockFuse;
  let sampleData;

  beforeEach(() => {
    vi.clearAllMocks();
    sampleData = [
      { term: "London", uid: "UID1", state: "England", type: "city", lat: 51.5072, lng: -0.1276 },
      { term: "Los Angeles", uid: "UID2", state: "California", type: "city", lat: 34.0522, lng: -118.2437 },
      { term: "Lonely Island", uid: "UID3", state: "Fiction", type: "island", lat: 10, lng: 20 },
    ];

    mockFuse = {
      search: vi.fn().mockReturnValue(sampleData.map(item => ({ item, score: 0.1 }))),
    };

    Fuse.mockImplementation(() => mockFuse);
  });

  it("BUT-01-001/002: Initializes Fuse with dataset and keys", () => {
    worker.init(sampleData);
    expect(Fuse).toHaveBeenCalledWith(sampleData, expect.objectContaining({
      keys: expect.arrayContaining(["term", "lat", "lng", "state", "type", "uid"])
    }));
  });

  it("BUT-01-003: Returns fuzzy matches for query", () => {
    worker.init(sampleData);
    mockFuse.search.mockReturnValue([{ item: sampleData[0], score: 0.1 }]);
    const results = worker.search("Lon");
    expect(results).toEqual([sampleData[0]]);
  });

  it("BUT-01-004: Returns empty array for empty or whitespace query", () => {
    worker.init(sampleData);
    expect(worker.search("")).toEqual([]);
    expect(worker.search("   ")).toEqual([]);
  });

  it("BUT-01-005: Exact match repositioned to first", () => {
    worker.init(sampleData);
    mockFuse.search.mockReturnValue([
      { item: sampleData[1], score: 0.3 },
      { item: sampleData[0], score: 0.9 }
    ]);
    const results = worker.search("London");
    expect(results[0]).toEqual(sampleData[0]);
  });

  it("BUT-01-006: Numeric lat/lng match prioritized to first", () => {
    worker.init(sampleData);
    const decimalLat = sampleData[1].lat + 1e-6;
    const decimalLng = sampleData[1].lng - 1e-6;
    mockFuse.search.mockReturnValue([
      { item: sampleData[0], score: 0.3 },
      { item: sampleData[1], score: 0.9 }
    ]);
    const results = worker.search(`${decimalLat},${decimalLng}`);
    expect(results[0]).toEqual(sampleData[1]);
  });

  //this one in particular failed initially.
  it("BUT-01-007: Results are sorted by relevance", () => {
    worker.init(sampleData);
    mockFuse.search.mockReturnValue([
      { item: sampleData[1], score: 0.2 },
      { item: sampleData[0], score: 0.1 }
    ]);
    const results = worker.search("Lon");
    expect(results).toEqual([sampleData[0], sampleData[1]]);
  });

  it("BUT-01-008: Results limited to top 8", () => {
    worker.init(sampleData);
    const many = Array(20).fill({ item: { term: "CityX" }, score: 0.1 });
    mockFuse.search.mockReturnValue(many);
    const results = worker.search("City");
    expect(results.length).toBeLessThanOrEqual(8);
  });

  it("BUT-01-009: Substring matches anywhere in searched fields", () => {
    worker.init(sampleData);
    mockFuse.search.mockReturnValue([{ item: sampleData[2], score: 0.2 }]);
    const results = worker.search("lon");
    expect(results[0]).toEqual(sampleData[2]);
  });
});
