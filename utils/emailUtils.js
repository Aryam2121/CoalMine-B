import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const FROM_EMAIL = process.env.COMPLIANCE_FROM_EMAIL || process.env.OTP_FROM_EMAIL || 'aryamangupta2121@gmail.com';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[email] SENDGRID_API_KEY not set; skipping email to', to);
    return { sent: false, reason: 'missing_api_key' };
  }
  if (!to) return { sent: false, reason: 'missing_recipient' };

  const msg = {
    to,
    from: FROM_EMAIL,
    subject,
    text,
    html: html || text,
  };

  try {
    await sgMail.send(msg);
    return { sent: true };
  } catch (error) {
    console.error('[email] Send failed:', error.message);
    return { sent: false, reason: error.message };
  }
};

export default { sendEmail };
