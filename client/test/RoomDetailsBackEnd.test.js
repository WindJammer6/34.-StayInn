const request = require("supertest");
const axios = require("axios");

jest.mock("axios");
// Prevent Stripe/Mongo side effects when importing the server file
jest.mock("../../server/db/conn.js", () => ({ db: { collection: jest.fn() } }));
jest.mock("stripe", () => () => ({ paymentIntents: { create: jest.fn() } }));

const app = require("../../server/server");

const okHotels = { hotels: [{ id: "diH7", name: "Test Hotel" }] };
const okPrices = { prices: [{ hotel_id: "diH7", price: 123.45 }] };
const okRoomPrice = {
  name: "Test Hotel",
  rooms: [{ key: "1", price: 100, currency: "SGD" }],
};

const defaultHotelsQuery = {
  destination_id: "WD0M",
  // lang/currency/country_code/guests should default in server
};

const fullHotelsQuery = {
  destination_id: "WD0M",
  lang: "en_US",
  currency: "SGD",
  country_code: "SG",
  guests: "2",
};

const pricesQuery = {
  destination_id: "WD0M",
  checkin: "2025-10-10",
  checkout: "2025-10-17",
  lang: "en_US",
  currency: "SGD",
  country_code: "SG",
  guests: "2",
};

describe("Hotels API (backend)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "test";
    process.env.CLIENT_URL = "http://localhost:5173";
  });

  test("GET /api/hotels returns upstream data and applies defaults", async () => {
    axios.get.mockResolvedValueOnce({ data: okHotels });

    const res = await request(app)
      .get("/api/hotels")
      .query(defaultHotelsQuery)
      .expect(200);

    expect(res.body).toEqual(okHotels);

    expect(axios.get).toHaveBeenCalledTimes(1);
    const [calledUrl] = axios.get.mock.calls[0];

    const u = new URL(calledUrl);
    expect(u.origin + u.pathname).toBe(
      "https://hotelapi.loyalty.dev/api/hotels"
    );

    const p = u.searchParams;
    expect(p.get("destination_id")).toBe("WD0M");
    expect(p.get("lang")).toBe("en_US"); // default
    expect(p.get("currency")).toBe("SGD"); // default
    expect(p.get("country_code")).toBe("SG"); // default
    expect(p.get("guests")).toBe("2"); // default
    expect(p.get("partner_id")).toBe("1089");
    expect(p.get("landing_page")).toBe("wl-acme-earn");
    expect(p.get("product_type")).toBe("earn");
  });

  test("GET /api/hotels responds 500 on upstream error", async () => {
    axios.get.mockRejectedValueOnce(new Error("supplier down"));

    const res = await request(app)
      .get("/api/hotels")
      .query(fullHotelsQuery)
      .expect(500);

    expect(res.body).toMatchObject({ error: expect.stringMatching(/failed/i) });
  });

  test("GET /api/hotels/prices forwards query and appends partner params", async () => {
    axios.get.mockResolvedValueOnce({ data: okPrices });

    const res = await request(app)
      .get("/api/hotels/prices")
      .query(pricesQuery)
      .expect(200);

    expect(res.body).toEqual(okPrices);

    expect(axios.get).toHaveBeenCalledTimes(1);
    const [calledUrl] = axios.get.mock.calls[0];

    const u = new URL(calledUrl);
    expect(u.origin + u.pathname).toBe(
      "https://hotelapi.loyalty.dev/api/hotels/prices"
    );

    const p = u.searchParams;
    // original query
    expect(p.get("destination_id")).toBe("WD0M");
    expect(p.get("checkin")).toBe("2025-10-10");
    expect(p.get("checkout")).toBe("2025-10-17");
    expect(p.get("lang")).toBe("en_US");
    expect(p.get("currency")).toBe("SGD");
    expect(p.get("country_code")).toBe("SG");
    expect(p.get("guests")).toBe("2");
    // appended partner params
    expect(p.get("partner_id")).toBe("1089");
    expect(p.get("landing_page")).toBe("wl-acme-earn");
    expect(p.get("product_type")).toBe("earn");
  });

  test("GET /api/hotels/prices responds 500 on upstream error", async () => {
    axios.get.mockRejectedValueOnce(new Error("timeout"));

    const res = await request(app)
      .get("/api/hotels/prices")
      .query(pricesQuery)
      .expect(500);

    expect(res.body).toMatchObject({ error: expect.stringMatching(/failed/i) });
  });

  test("GET /api/hotels/:id/price forwards to supplier with required params", async () => {
    axios.get.mockResolvedValueOnce({ data: okRoomPrice });

    const res = await request(app)
      .get("/api/hotels/diH7/price")
      .query(pricesQuery)
      .expect(200);

    expect(res.body).toEqual(okRoomPrice);

    expect(axios.get).toHaveBeenCalledTimes(1);
    const [calledUrl] = axios.get.mock.calls[0];

    const u = new URL(calledUrl);
    expect(u.origin + u.pathname).toBe(
      "https://hotelapi.loyalty.dev/api/hotels/diH7/price"
    );

    const p = u.searchParams;
    expect(p.get("destination_id")).toBe("WD0M");
    expect(p.get("checkin")).toBe("2025-10-10");
    expect(p.get("checkout")).toBe("2025-10-17");
    expect(p.get("lang")).toBe("en_US");
    expect(p.get("currency")).toBe("SGD");
    expect(p.get("country_code")).toBe("SG");
    expect(p.get("guests")).toBe("2");
    expect(p.get("partner_id")).toBe("1089");
    expect(p.get("landing_page")).toBe("wl-acme-earn");
    expect(p.get("product_type")).toBe("earn");
  });

  test("GET /api/hotels/:id/price responds 500 on upstream error", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    const res = await request(app)
      .get("/api/hotels/diH7/price")
      .query(pricesQuery)
      .expect(500);

    expect(res.body).toMatchObject({ error: expect.stringMatching(/failed/i) });
  });
});
