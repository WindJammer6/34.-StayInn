const express = require('express');

const router = express.Router();

router.get('/hello', async (_req, res) => {
  res.status(200).json({ message: 'Hello World!' });
});

router.get('/getHotels', async (_req, res) => {
  try {
    const response = await fetch('https://hotelapi.loyalty.dev/api/hotels?destination_id=RsBU');
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch hotel data' });
  }
});

module.exports = router;
