// api/register.js
// Receives seller registration form submissions and stores them in Supabase.
// Runs server-side only — the service role key never reaches the browser.

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // Allow the browser to call this from your site
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      firstName,
      lastName,
      mobile,
      email,
      businessName,
      sellerCategory,
      district
    } = req.body;

    // Basic validation
    if (!firstName || !lastName || !mobile) {
      return res.status(400).json({ error: 'First name, last name, and mobile number are required.' });
    }

    const { data, error } = await supabase
      .from('registrations')
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          mobile: mobile,
          email: email || null,
          business_name: businessName || null,
          seller_category: sellerCategory || null,
          district: district || null
        }
      ])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Could not save registration. Please try again.' });
    }

    return res.status(200).json({ success: true, registration: data[0] });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
