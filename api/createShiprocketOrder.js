export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { orderDetails } = body;

    if (!orderDetails) {
      return res.status(400).json({ error: 'Order details are required' });
    }

    // 1. Authenticate with Shiprocket
    const authResponse = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'sampricta5@gmail.com',
        password: 'BFwsMiBH*jlJ!#p9R^4okckccA!$n1RD'
      })
    });

    const authData = await authResponse.json();

    if (!authResponse.ok || !authData.token) {
      console.error("Shiprocket Auth Failed:", authData);
      return res.status(500).json({ error: 'Failed to authenticate with Shiprocket', details: authData });
    }

    const token = authData.token;

    // 2. Format Order Items
    const orderItems = orderDetails.items.map(item => ({
      name: item.name,
      sku: item.id || 'KOLKAA-CUSTOM',
      units: item.qty,
      selling_price: item.price,
      discount: 0,
      tax: 0,
      hsn: 42022220 // standard HSN for cases/accessories, adjust if needed
    }));

    // Generate a unique 8-digit order ID for Shiprocket if not provided
    const uniqueOrderId = orderDetails.orderId || `KOLKAA_${Date.now().toString().slice(-8)}`;

    // 3. Create Order Payload for Shiprocket
    const shiprocketPayload = {
      order_id: uniqueOrderId,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location: '9/2 police lane, kotrung, hooghly west bengal', // Must match EXACT alias in Shiprocket
      billing_customer_name: orderDetails.customer.name,
      billing_last_name: '',
      billing_address: orderDetails.customer.address,
      billing_city: orderDetails.customer.city,
      billing_pincode: orderDetails.customer.pincode,
      billing_state: orderDetails.customer.state,
      billing_country: 'India',
      billing_email: orderDetails.userEmail || 'customer@kolkadeshine.in',
      billing_phone: orderDetails.customer.phone,
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: 'Prepaid', // Assuming Razorpay handled it
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: orderDetails.total,
      length: orderDetails.package_details?.length || 15,
      breadth: orderDetails.package_details?.width || 8,
      height: orderDetails.package_details?.height || 2,
      weight: orderDetails.package_details?.weight || 0.2
    };

    // 4. Send Order to Shiprocket
    const orderResponse = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(shiprocketPayload)
    });

    const orderResult = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error("Shiprocket Order Creation Failed:", orderResult);
      return res.status(500).json({ error: 'Failed to create Shiprocket order', details: orderResult });
    }

    // Success! Return the Shiprocket AWB / tracking details to the frontend
    res.status(200).json({ 
      success: true, 
      message: 'Order created successfully on Shiprocket',
      shiprocket_order_id: orderResult.order_id,
      shipment_id: orderResult.shipment_id,
      status: orderResult.status
    });

  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ error: err.message });
  }
}
