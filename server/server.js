require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const db = require("./db/conn.js").db;

const corsOptions = {
  origin: [process.env.CLIENT_URL],
};

app.use(cors(corsOptions));
app.use(express.json());

// middleware for when verifying clerk token later on
/*
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

app.use('/api/protected', ClerkExpressRequireAuth());
*/

app.get("/api/hotels/:id/price", async (req, res) => {
  const hotelId = req.params.id;
  const {
    destination_id,
    checkin,
    checkout,
    guests,
    lang,
    currency,
    country_code,
  } = req.query;

  const ascendaUrl =
    `https://hotelapi.loyalty.dev/api/hotels/${hotelId}/price?` +
    new URLSearchParams({
      destination_id,
      checkin,
      checkout,
      lang,
      currency,
      country_code,
      guests,
      partner_id: "1089",
      landing_page: "wl-acme-earn",
      product_type: "earn",
    }).toString();

  try {
    const response = await axios.get(ascendaUrl);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching room data:", error);
    res.status(500).json({ error: "Failed to fetch room data" });
  }
});

// search API with dummy data
const hotels = [
  { name: "HolidayInn", city: "Malaysia", price: "$111/night" },
  { name: "Hotel81", city: "Singapore", price: "$81/night" },
  { name: "Ascott", city: "Thailand", price: "$200/night" },
];

app.post("/api/search-hotels", (req, res) => {
  const { destination } = req.body;

  // error handling
  if (!destination) {
    return res.status(400).json({ error: "Destination required" });
  }

  // exact matching for search
  // if want to use partical matching: h => h.city.toLowerCase() .includes(destination.toLowerCase())
  const filtered = hotels.filter(
    (h) => h.city.toLowerCase() === destination.toLowerCase()
  );
  res.json(filtered);
});

// to include app.get for clerk authentication route?

app.get("/api/hotels", async (req, res) => {
  const {
    destination_id,
    lang = "en_US",
    currency = "SGD",
    country_code = "SG",
    guests = "2",
  } = req.query;

  const url =
    "https://hotelapi.loyalty.dev/api/hotels?" +
    new URLSearchParams({
      destination_id,
      lang,
      currency,
      country_code,
      guests,
      partner_id: "1089",
      landing_page: "wl-acme-earn",
      product_type: "earn",
    }).toString();

  try {
    const { data } = await axios.get(url);
    res.json(data);
  } catch (error) {
    console.error("Error fetching hotel list:", error.message);
    res.status(500).json({ error: "Failed to fetch hotel list" });
  }
});

app.get("/api/hotels/prices", async (req, res) => {
  const url =
    "https://hotelapi.loyalty.dev/api/hotels/prices?" +
    new URLSearchParams({
      ...req.query,
      partner_id: "1089",
      landing_page: "wl-acme-earn",
      product_type: "earn",
    }).toString();

  try {
    const { data } = await axios.get(url);
    res.json(data);
  } catch (error) {
    console.error("Error fetching hotel prices:", error);
    res.status(500).json({ error: "Failed to fetch hotel prices" });
  }
});

//for stripe
app.post("/api/create-payment-intent", async (req, res) => {
  try {
    const { currency, amount } = req.body;

    if (!currency || !amount) {
      return res.status(400).json({ error: "Pricing information is required" });
    }

    console.log("Pricing received:", amount);
    const amount_in_cents = Math.round(parseFloat(amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount_in_cents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe error:", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
});

//mongodb
app.get("/api/bookingresults", async (req, res) => {
  let collection = await db.collection("Bookings");
  let results = await collection.find({}).limit(50).toArray();
  res.send(results).status(200);
});

app.post("/api/bookings", async (req, res) => {
  let collection = await db.collection("Bookings");
  let newDocument = req.body;
  newDocument.date = new Date();
  let result = await collection.insertOne(newDocument);
  res.send(result).status(204);
});

// IMPORTANT: Guard the listener so it doesn't run during tests
if (process.env.NODE_ENV !== "test") {
  app.listen(process.env.PORT || 8080, () => {
    console.log(`Server started on port ${process.env.PORT || 8080}`);
  });
}

module.exports = app;
