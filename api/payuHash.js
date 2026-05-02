import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { txnid, amount, productinfo, firstname, email } = body;
    
    // Fallbacks for testing if variables are not yet set
    const key = process.env.VITE_PAYU_MERCHANT_KEY || 'gtKFFx'; // Default test key
    const salt = process.env.PAYU_SALT || 'eCwWELxi'; // Default test salt

    if (!txnid || !amount || !productinfo || !firstname || !email) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Hash sequence: key|txnid|amount|productinfo|firstname|email|||||||||||salt
    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    res.status(200).json({ hash, key });
  } catch (err) {
    console.error("PayU Hash Error:", err);
    res.status(500).json({ error: err.message });
  }
}
