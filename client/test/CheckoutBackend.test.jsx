import request from "supertest";
import { vi, describe, it, expect, beforeAll, beforeEach } from "vitest";

// --- Setup mocks ---
const insertOneMock = vi.fn();
const findMock = vi.fn();
const toArrayMock = vi.fn();
const limitMock = vi.fn();
const dbMock = {
  collection: vi.fn().mockReturnValue({
    insertOne: insertOneMock,
    find: findMock.mockReturnValue({
      limit: limitMock.mockReturnValue({
        toArray: toArrayMock,
      }),
    }),
  }),
};

vi.mock("../../server/db/conn.js", () => {
  return {
    db: dbMock,
  };
});

const stripeMock = {
  paymentIntents: {
    create: vi.fn(),
  },
};
vi.mock("stripe", () => {
  return vi.fn(() => stripeMock);
});

let app;
beforeAll(async () => {
  const mod = await import("../../server/server.js");
  app = mod.default || mod;
});

describe("Stripe API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fail if currency is missing", async () => {
    const res = await request(app).post("/api/create-payment-intent").send({
      amount: 100,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Pricing information is required");
  });

  it("should fail if amount is missing", async () => {
    const res = await request(app).post("/api/create-payment-intent").send({
      currency: "usd",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Pricing information is required");
  });
});

describe("MongoDB API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mock implementations
    dbMock.collection.mockReturnValue({
      insertOne: insertOneMock,
      find: findMock.mockReturnValue({
        limit: limitMock.mockReturnValue({
          toArray: toArrayMock,
        }),
      }),
    });
  });

  it("should handle db error when fetching bookings", async () => {
    toArrayMock.mockRejectedValueOnce(new Error("DB fetch error"));

    const res = await request(app).get("/api/bookingresults");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch booking results");
  });

  it("should handle db error when inserting booking", async () => {
    insertOneMock.mockRejectedValue(new Error("Insert error"));

    const res = await request(app).post("/api/bookings").send({
      hotel: "Test Hotel",
      guest: "Charlie",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to insert booking");
  });
});