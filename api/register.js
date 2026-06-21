// api/register.js
// Receives seller registration form submissions and stores them in Supabase.
// Runs server-side only — the service role key never reaches the browser.

const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Send a confirmation email if the seller provided one.
    // We don't let an email failure block the registration itself —
    // the registration is already saved successfully at this point.
    if (email) {
      try {
        await resend.emails.send({
          from: 'CommunityAdda <onboarding@resend.dev>',
          to: [email],
          subject: 'You\'re registered with CommunityAdda! 🎉',
          html: `
            <div style="font-family:'Segoe UI',sans-serif; max-width:480px; margin:0 auto; padding:24px;">
              <h2 style="color:#1a2b5e;">Hi ${firstName},</h2>
              <p style="font-size:15px; color:#333; line-height:1.6;">
                Thank you for registering with CommunityAdda! Our team will review your details
                and get in touch with you shortly for the next steps.
              </p>
              <p style="font-size:13px; color:#888; margin-top:24px;">
                — Team CommunityAdda<br/>
                <a href="mailto:communityadda.official@gmail.com" style="color:#e85d1e;">communityadda.official@gmail.com</a>
              </p>
            </div>
          `
        });
      } catch (emailErr) {
        console.error('Resend email error:', emailErr);
        // Registration still succeeds even if the email fails to send.
      }
    }

    return res.status(200).json({ success: true, registration: data[0] });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
