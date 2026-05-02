export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const appId = process.env.VITE_CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    const response = await fetch(`https://sandbox.cashfree.com/pg/orders/${orderId}/payments`, {
      method: 'GET',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to verify Cashfree order', details: data });
    }

    // data is an array of payments. Find if any is SUCCESS
    const isPaid = data.some(payment => payment.payment_status === 'SUCCESS');

    res.status(200).json({ isPaid, payments: data });
  } catch (err) {
    console.error("Cashfree Verify Error:", err);
    res.status(500).json({ error: err.message });
  }
}
