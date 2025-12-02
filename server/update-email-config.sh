#!/bin/bash
# Update AWAKE Connect Email Configuration
# Run this after email server setup is complete

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN} Updating AWAKE Connect Email Configuration${NC}"

# Backup existing .env
cp server/.env server/.env.backup

# Update .env with new email configuration
cat >> server/.env << 'EOF'

# Professional Email Server Configuration
EMAIL_HOST=mail.aircrew.nl
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@aircrew.nl
EMAIL_PASS=NoreplySecure2024!
EMAIL_FROM=AWAKE Connect <noreply@aircrew.nl>

# Alternative SMTP settings for different scenarios
EMAIL_HOST_SECURE=mail.aircrew.nl
EMAIL_PORT_SECURE=465
EMAIL_SECURE_TLS=true

# Email rate limiting (already configured in emailService.js)
EMAIL_RATE_LIMIT=5
EMAIL_RATE_WINDOW=60000
EOF

echo -e "${GREEN} Email configuration updated${NC}"
echo -e "${YELLOW} New configuration:${NC}"
echo -e "Host: mail.aircrew.nl"
echo -e "Port: 587 (STARTTLS) / 465 (SSL/TLS)"
echo -e "User: noreply@aircrew.nl"
echo -e "From: AWAKE Connect <noreply@aircrew.nl>"

echo -e "\n${YELLOW} Restart your Node.js server after DNS propagation${NC}"