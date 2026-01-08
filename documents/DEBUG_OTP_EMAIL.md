# Debugging OTP Email Issue

## Changes Made

I've added comprehensive logging to help debug why OTP emails aren't being sent to farmers. 

### Files Modified:
1. `backend/routes/hub.js` - Added detailed logging in generate-otp endpoint
2. `backend/utils/emailService.js` - Added detailed logging in sendEmail and sendHubArrivalOTPEmail functions

## Steps to Test:

### 1. Restart Backend Server
```bash
cd c:\Project\Cardo_Project\mini-project\backend
# Stop the current server (Ctrl+C)
node server.js
```

### 2. Test the OTP Flow
1. Go to frontend: http://localhost:5173
2. Login as hub manager or farmer
3. Navigate to Hub Network → District (e.g., Idukki)
4. Click "📧 Send OTP to Farmer & Confirm Arrival" button

### 3. Check Backend Console Logs

You should see detailed logs like:
```
✅ OTP generated for activity [id]: [6-digit-otp]
📧 Attempting to send OTP to farmer...
   Farmer: [farmer name]
   Email: [farmer email]
   Product: [product name]
   OTP: [6-digit-otp]
📧 [sendHubArrivalOTPEmail] Preparing email...
   To: [farmer email]
   Farmer: [farmer name]
   Product: [product name]
   OTP: [6-digit-otp]
📧 [sendHubArrivalOTPEmail] Calling sendEmail...
📧 [sendEmail] Starting email send process...
   NODE_ENV: development
   FORCE_DEV_EMAIL: false
   To: [farmer email]
   Subject: 🔐 OTP for Hub Arrival Confirmation - [otp]
📧 [sendEmail] Preparing mail options...
📧 [sendEmail] Mail from: "E-Cardamom Connect" <alexantony2026@mca.ajce.in>
📧 [sendEmail] Sending via transporter...
✅ [sendEmail] Email sent successfully to: [farmer email]
📧 [sendEmail] Message ID: [message-id]
```

## Common Issues to Check:

### Issue 1: Email Not Being Sent (Dev Mode Active)
**Symptom:** Log shows: `⚠️ [sendEmail] DEV MODE - Email NOT actually sent (logged only)`

**Solution:** This means `FORCE_DEV_EMAIL=true` or `NODE_ENV=test`
- Check `.env` file: `FORCE_DEV_EMAIL` should be `false`
- Restart server after changing `.env`

### Issue 2: SMTP Authentication Error
**Symptom:** Log shows: `❌ [sendEmail] Error: Invalid login`

**Solution:** 
- Gmail App Password might be incorrect
- Check `SMTP_USER` and `SMTP_PASS` in `.env`
- Generate new App Password: Google Account → Security → App Passwords

### Issue 3: Farmer Email Not Found
**Symptom:** Log shows: `❌ Farmer email not found!`

**Solution:**
- The farmer record doesn't have an email
- Check database: ensure farmer has valid email address

### Issue 4: Activity Not Found
**Symptom:** Response shows: `Activity not found`

**Solution:**
- The activity ID might be invalid
- Check if there are actual sales activities in the district

## Current Email Configuration:
```
USE_GMAIL=true
SMTP_USER=alexantony2026@mca.ajce.in
SMTP_PASS=snht zpzu xvnz ucmj
SMTP_SECURE=true
SMTP_PORT=465
MAIL_FROM=alexantony2026@mca.ajce.in
FORCE_DEV_EMAIL=false
NODE_ENV=development
```

## What to Share:
After testing, please share:
1. The complete console log output from backend
2. Any error messages shown in the frontend
3. The farmer's email address being used (to verify it's valid)

This will help identify exactly where the email sending is failing.
