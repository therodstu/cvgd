// Email service using nodemailer
const nodemailer = require('nodemailer');

// Create transporter - using Gmail SMTP
// For production, you should use environment variables for credentials
const createTransporter = () => {
  // If SMTP credentials are provided, use them
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  // Fallback: Use Gmail with app password
  // Note: You'll need to set up an app password in Gmail settings
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  
  // If no email config, return null (emails won't work but app won't crash)
  console.warn('No email configuration found. Feature request emails will not be sent.');
  return null;
};

const transporter = createTransporter();

// Send feature request email
async function sendFeatureRequestEmail(featureDescription, userEmail) {
  if (!transporter) {
    console.error('Email transporter not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const recipientEmail = process.env.FEATURE_REQUEST_EMAIL || 'therodstu@gmail.com';
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@clintonvillegirldads.com',
    to: recipientEmail,
    subject: 'New Feature Request - Clintonville Girl Dads',
    html: `
      <h2>New Feature Request</h2>
      <p><strong>From:</strong> ${userEmail || 'Anonymous'}</p>
      <p><strong>Feature Description:</strong></p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        ${featureDescription.replace(/\n/g, '<br>')}
      </div>
      <p><em>Sent from Clintonville Girl Dads application</em></p>
    `,
    text: `
New Feature Request

From: ${userEmail || 'Anonymous'}

Feature Description:
${featureDescription}

Sent from Clintonville Girl Dads application
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Feature request email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending feature request email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendFeatureRequestEmail,
};

