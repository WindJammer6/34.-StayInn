const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");

const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true, // for clerk token later
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: [  // for clerk token
    'Content-Type',
    'Authorisation'
  ]
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
  {name: "HolidayInn", city: "Malaysia", price: "$111/night"},
  {name: "Hotel81", city: "Singapore", price: "$81/night"},
  {name: "Ascott", city: "Thailand", price: "$200/night"}
];

app.post("/api/search-hotels", (req, res) => {
  const {destination} = req.body;

  // error handling
  if (!destination){
    return res.status(400).json({error: "Destination required"});
  }

  // exact matching for search
  // if want to use partical matching: h => h.city.toLowerCase() .includes(destination.toLowerCase())
  const filtered = hotels.filter(h => h.city.toLowerCase() === destination.toLowerCase());
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

app.listen(8080, () => {
  console.log("Server started on port 8080");
});