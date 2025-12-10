# Email Setup for Feature Requests

## Overview

The "Request a Feature" button sends emails to **therodstu@gmail.com** using nodemailer.

## Setup Options

### Option 1: Gmail with App Password (Recommended for Quick Setup)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password:**
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Set Environment Variables in Railway:**
   - Go to Backend service → **Variables**
   - Add:
     - `GMAIL_USER` = `therodstu@gmail.com`
     - `GMAIL_APP_PASSWORD` = `[your-16-character-app-password]`
     - `FEATURE_REQUEST_EMAIL` = `therodstu@gmail.com` (optional, defaults to this)

### Option 2: Custom SMTP Server

If you have your own SMTP server:

1. **Set Environment Variables in Railway:**
   - `SMTP_HOST` = `smtp.yourdomain.com`
   - `SMTP_PORT` = `587` (or `465` for SSL)
   - `SMTP_USER` = `your-email@yourdomain.com`
   - `SMTP_PASS` = `your-password`
   - `SMTP_FROM` = `noreply@yourdomain.com` (optional)
   - `FEATURE_REQUEST_EMAIL` = `therodstu@gmail.com`

### Option 3: Email Service (SendGrid, Mailgun, etc.)

For production, consider using a dedicated email service:

**SendGrid Example:**
- `SMTP_HOST` = `smtp.sendgrid.net`
- `SMTP_PORT` = `587`
- `SMTP_USER` = `apikey`
- `SMTP_PASS` = `[your-sendgrid-api-key]`

## Testing

After setting up environment variables:

1. Redeploy your backend service
2. Click "Request a Feature" in the app
3. Fill out the form and submit
4. Check your email at **therodstu@gmail.com**

## Troubleshooting

### Emails Not Sending?

1. **Check Railway Logs:**
   - Backend service → Deployments → Logs
   - Look for email-related errors

2. **Verify Environment Variables:**
   - Make sure all required variables are set
   - Check for typos in variable names

3. **Gmail App Password Issues:**
   - Make sure 2FA is enabled
   - Regenerate app password if needed
   - Don't use your regular Gmail password

4. **SMTP Connection Issues:**
   - Verify SMTP host and port
   - Check firewall/network restrictions
   - Some providers require IP whitelisting

## Current Configuration

- **Recipient Email:** `therodstu@gmail.com` (hardcoded in emailService.js)
- **Email Service:** Uses nodemailer
- **Fallback:** If email config is missing, the app won't crash but emails won't be sent

## Security Notes

- ✅ Never commit email passwords to git
- ✅ Use environment variables for all credentials
- ✅ Use app passwords, not regular passwords
- ✅ Consider rate limiting for production

