const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");

const corsOptions = {
  origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));

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

app.listen(8080, () => {
  console.log("Server started on port 8080");
});

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
