#  MANUAL DEPLOYMENT GUIDE - aircrew.nl

## Quick Deployment Steps

### 1. SSH into your aircrew.nl server:
```bash
ssh root@aircrew.nl
# or
ssh yourusername@aircrew.nl
```

### 2. Navigate to your AWAKE app directory:
```bash
# Common locations - adjust as needed:
cd /var/www/awake
# OR cd /home/awake
# OR cd /opt/awake  
# OR cd /var/www/html/awake
```

### 3. Pull the latest code with reCAPTCHA protection:
```bash
git stash push -m "Pre-deployment backup"
git pull origin main
```

### 4. Install dependencies:
```bash
# Backend
cd server
npm install --production
cd ..

# Frontend  
npm install --production
```

### 5. Build production version:
```bash
npm run build
```

### 6. Restart services:
```bash
# If using PM2:
pm2 reload all
pm2 status

# If using systemctl:
sudo systemctl restart awake
sudo systemctl status awake

# If manually running:
pkill -f "node.*server"
nohup npm start &
```

### 7. Verify deployment:
```bash
# Check API health
curl https://aircrew.nl/api/health
# OR
curl http://localhost:3001/api/health

# Check frontend
curl https://aircrew.nl
```

---

##  What This Deployment Includes:

️ **Complete reCAPTCHA Spam Protection System**
- Donor registration protection
- Password reset flood protection  
- Case worker creation protection
- Interview scheduling protection
- Board member creation protection
- Messaging system spam protection
- Student reply protection

 **Email Server Crisis Resolution**
- Blocks the 200+ daily spam emails
- Secures all email-sending endpoints
- Maintains legitimate user experience

 **7 Protected Forms/Endpoints**
- `/api/auth/register-donor` & `/api/auth/request-password-reset`
- `/api/users/sub-admins` & `/api/users/case-workers`
- `/api/interviews` & `/api/board-members`
- `/api/messages` & `/api/conversations/*`

---

##  If Deployment Fails:

1. **Check Git status**: `git status`, `git log --oneline -5`
2. **Check Node.js version**: `node --version` (should be 18+)
3. **Check dependencies**: `npm list --depth=0`
4. **Check logs**: `pm2 logs` or `journalctl -u awake -f`
5. **Manual restart**: `pm2 restart all` or restart your service

---

##  Post-Deployment Testing:

1. **Test Donor Signup**: https://aircrew.nl/signup → Should show reCAPTCHA
2. **Test Password Reset**: https://aircrew.nl/forgot-password → Should be protected
3. **Test Admin Functions**: Login as admin, try creating case workers
4. **Monitor Email Logs**: Check that spam emails are blocked

**Deployment completed!** 