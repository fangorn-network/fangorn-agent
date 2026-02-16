const express = require('express');
const app = express();

app.get('/games', (req, res) => {
  console.log("resource endpoint called");
  res.status(402).json({ price: 69.99, owner: 'djmoneystax' });
});

app.get('/music', (req, res) => {
  console.log("resource endpoint called");
  res.status(402).json({ price: 420.99, owner: 'djmoneystax' });
});

app.listen(3000, () => console.log('Server running on port 3000'));