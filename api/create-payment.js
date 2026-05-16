export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const PAYREX_SECRET_KEY = process.env.PAYREX_SECRET_KEY;
  const PAYREX_FORCE_AMOUNT = process.env.PAYREX_FORCE_AMOUNT ? Number(process.env.PAYREX_FORCE_AMOUNT) : null;

  if (!PAYREX_SECRET_KEY) {
    return res.status(500).json({ error: 'Payrex secret key is not configured.' });
  }

  const { reference_code, amount, currency = 'PHP', description } = req.body || {};
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
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Payrex request failed', details: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Payrex create-payment error:', err);
    return res.status(500).json({ error: 'Failed to reach Payrex API.', details: err.message });
  }
}
