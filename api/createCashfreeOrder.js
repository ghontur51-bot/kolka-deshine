export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { orderId, amount, customerPhone, customerEmail, customerName } = body;

    const appId = process.env.VITE_CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    const payload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: orderId.replace('txn_', 'cust_'), // simple mapping
        customer_name: customerName || "Customer",
        customer_email: customerEmail || "customer@kolkadeshine.in",
        customer_phone: customerPhone || "9999999999"
      },
      order_meta: {
        // Redirect to same origin with payment status params
        return_url: `${req.headers.origin || 'http://localhost:5173'}/?order_id={order_id}&payment=cashfree_redirect`
      }
    };

    const response = await fetch('https://sandbox.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Cashfree API Error:", data);
      return res.status(500).json({ error: 'Failed to create Cashfree order', details: data });
    }

    res.status(200).json({ payment_session_id: data.payment_session_id });
  } catch (err) {
    console.error("Cashfree Order Error:", err);
    res.status(500).json({ error: err.message });
  }
}
