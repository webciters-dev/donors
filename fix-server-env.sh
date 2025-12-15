#!/bin/bash
# Fix NODE_ENV loading in server.js on the VPS
# Run this on the VPS: bash fix-server-env.sh

FILE="/home/sohail/projects/donors/server/src/server.js"
BACKUP="${FILE}.backup"

# Backup original
cp "$FILE" "$BACKUP"
echo "📦 Backed up to $BACKUP"

# Check if already fixed
if grep -q "const envFile = process.env.NODE_ENV" "$FILE"; then
  echo "✅ server.js already has NODE_ENV loading"
  exit 0
fi

# Find the dotenv.config() line and replace it
# We need to find: dotenv.config();
# And replace with the conditional logic

if grep -q "^dotenv\.config();" "$FILE"; then
  sed -i 's/^dotenv\.config();$/\/\/ Load environment variables from appropriate .env file\nconst envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";\ndotenv.config({ path: envFile });/' "$FILE"
  echo "✅ Fixed server.js to load .env.production in production mode"
else
  echo "⚠️ Could not find dotenv.config() line - checking for variations..."
  if grep -q "dotenv\.config" "$FILE"; then
    echo "⚠️ Found dotenv.config but in unexpected format"
    echo "Please manually update the dotenv.config() call in server/src/server.js"
    echo "Change from: dotenv.config();"
    echo "Change to:"
    echo "  const envFile = process.env.NODE_ENV === \"production\" ? \".env.production\" : \".env\";"
    echo "  dotenv.config({ path: envFile });"
    exit 1
  fi
fi
