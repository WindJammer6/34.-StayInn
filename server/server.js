const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");

const corsOptions = {
  origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));

app.get("/api/hotels/:id/prices", async (req, res) => {
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

  const ascendaUrl = `https://hotelapi.loyalty.dev/api/hotels/${hotelId}/price?destination_id=${destination_id}&checkin=${checkin}&checkout=${checkout}&lang=${lang}&currency=${currency}&country_code=${country_code}&guests=${guests}&partner_id=1`;

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
