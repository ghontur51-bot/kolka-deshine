export default async function handler(req, res) {
  // PayU sends payment results via POST request to this URL
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    // In a production environment, you MUST verify the reverse hash sent by PayU here
    // Hash sequence for verification: salt|status|||||||||||email|firstname|productinfo|amount|txnid|key

    if (data.status === 'success') {
      // Redirect back to the frontend with success parameters
      res.redirect(302, `/?payment=success&txnid=${data.txnid}`);
    } else {
      // Redirect back to the frontend with failure parameters
      res.redirect(302, `/?payment=failed&txnid=${data.txnid}`);
    }
  } catch (err) {
    console.error("PayU Response Error:", err);
    res.redirect(302, `/?payment=error`);
  }
}
