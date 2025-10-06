# GMAIL EMAIL SETUP (Alternative)
# =================================
# 
# If you want to send REAL emails during localhost testing:
#
# 1. Enable 2-Factor Authentication on your Gmail account
# 2. Generate an App Password: 
#    - Google Account → Security → 2-Step Verification → App passwords
#    - Generate password for "Mail"
# 3. Add to .env file:
#
# EMAIL_USER="your.gmail@gmail.com"
# EMAIL_PASS="your-16-digit-app-password"
# NODE_ENV="development"  # Keep this for now
#
# 4. Update emailService.js to use Gmail in development:

# PRODUCTION EMAIL SETUP
# ======================
# EMAIL_USER="support@awakeconnect.org" 
# EMAIL_PASS="production-email-password"
# EMAIL_FROM="AWAKE Connect <support@awakeconnect.org>"
# NODE_ENV="production"