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
    partner_id = 1,
  } = req.query;

  const ascendaUrl = `https://hotelapi.loyalty.dev/api/hotels/${hotelId}/price?destination_id=${destination_id}&checkin=${checkin}&checkout=${checkout}&lang=${lang}&currency=${currency}&country_code=${country_code}&guests=${guests}&partner_id=${partner_id}`;

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

// ➊ Forward static hotel list
app.get("/api/hotels", async (req, res) => {
  const { destination_id } = req.query;
  const url = `https://hotelapi.loyalty.dev/api/hotels?destination_id=${destination_id}`;
  const { data } = await axios.get(url);
  res.json(data);
});

// ➋ Forward cheapest-price list
app.get("/api/hotels/prices", async (req, res) => {
  // pass everything through except partner_id (hard-code)
  const url =
    "https://hotelapi.loyalty.dev/api/hotels/prices?" +
    new URLSearchParams({ ...req.query, partner_id: 1 }).toString();
  const { data } = await axios.get(url);
  res.json(data);
});
