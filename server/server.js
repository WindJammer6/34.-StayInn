const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");
<<<<<<< HEAD
const stripe = require('stripe')('STRIPE_SECRET_KEY');

const corsOptions = {
  origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));
app.use(express.json());

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

//for stripe
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { pricing } = req.body;
    
    if (!pricing || !pricing.total) {
      return res.status(400).json({ error: 'Pricing information is required' });
    }
    
    console.log("Pricing received:", pricing);
    const amount = Math.round(parseFloat(pricing.total.replace('$', '')) * 100);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'sgd',
      automatic_payment_methods: { enabled: true }
    });
    
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

app.listen(8080, () => {
  console.log("Server started on port 8080");
});
