import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const PAYREX_SECRET_KEY = process.env.PAYREX_SECRET_KEY;
const PAYREX_FORCE_AMOUNT = process.env.PAYREX_FORCE_AMOUNT ? Number(process.env.PAYREX_FORCE_AMOUNT) : null;

if (!PAYREX_SECRET_KEY) {
  console.warn('WARNING: PAYREX_SECRET_KEY is not set. Payments will fail until you add it to .env.');
}

app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files with proper cache headers
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

app.post('/api/create-payment', async (req, res) => {
  if (!PAYREX_SECRET_KEY) {
    return res.status(500).json({ error: 'Payrex secret key is not configured on the server.' });
  }

  const { reference_code, amount, currency = 'PHP', description } = req.body;
  if (!reference_code || !amount) {
    return res.status(400).json({ error: 'Missing reference_code or amount in request body.' });
  }

  try {
    const chargeAmount = PAYREX_FORCE_AMOUNT || amount;
    const response = await fetch('https://api.payrex.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYREX_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: chargeAmount,
        currency,
        description: description || `Pickle Social booking ${reference_code}`,
        metadata: { reference_code }
      })
    });

    const data = await response.json();
    console.log('Payrex response status:', response.status);
    console.log('Payrex response data:', data);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Payrex request failed', details: data });
    }

    return res.json(data);
  } catch (err) {
    console.error('Payrex create-payment error:', err.message);
    console.error('Error details:', err);
    return res.status(500).json({ error: 'Failed to reach Payrex API.', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Serving static files and Payrex API proxy');
});
