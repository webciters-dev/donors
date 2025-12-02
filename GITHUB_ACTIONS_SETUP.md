# GitHub Actions CI/CD Setup Guide

This project uses GitHub Actions for automatic deployment to aircrew.nl when code is pushed to the `main` branch.

##  One-Time Setup Required

### Step 1: Generate SSH Key on Your Server (aircrew.nl)

SSH into your server and run:

```bash
ssh root@aircrew.nl

# Generate a dedicated deployment key (press Enter for all prompts)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# Add the public key to authorized_keys
cat ~/.ssh/github_deploy_key.pub >> ~/.ssh/authorized_keys

# Display the PRIVATE key (you'll need this for GitHub)
cat ~/.ssh/github_deploy_key
```

**Important:** Copy the entire private key output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

### Step 2: Add SSH Key to GitHub Secrets

1. Go to your GitHub repository: https://github.com/webciters-dev/donors
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `AIRCREW_SSH_KEY`
5. Value: Paste the entire private key from Step 1
6. Click **Add secret**

### Step 3: Test the Deployment

Option 1 - Push a change:
```bash
git add .
git commit -m "Test automated deployment"
git push origin main
```

Option 2 - Manual trigger:
1. Go to **Actions** tab in GitHub
2. Select **Deploy to Aircrew.nl** workflow
3. Click **Run workflow**

##  How It Works

- **Automatic**: Every push to `main` branch triggers deployment
- **Duration**: ~2-3 minutes from push to live
- **Process**:
  1. Pulls latest code on server
  2. Installs dependencies
  3. Builds frontend
  4. Restarts PM2 services
  5. Performs health check

##  Monitoring Deployments

View deployment status:
- **Actions tab**: https://github.com/webciters-dev/donors/actions
- **Badge**: Add to README.md (see below)

### Add Deployment Badge to README

Add this to your README.md:

```markdown
[![Deploy Status](https://github.com/webciters-dev/donors/actions/workflows/deploy.yml/badge.svg)](https://github.com/webciters-dev/donors/actions/workflows/deploy.yml)
```

##  Troubleshooting

### Deployment Fails with "Permission denied"
- Verify SSH key is correctly added to GitHub Secrets
- Ensure public key is in `~/.ssh/authorized_keys` on server

### Deployment Fails to Find App Directory
- Edit `.github/workflows/deploy.yml` and add your app path to the directory search list

### PM2 Not Found
- SSH into server and install PM2: `npm install -g pm2`

### Health Check Fails
- This is often a false alarm - manually verify https://aircrew.nl works
- The app may be running on a different port than expected

## ️ Manual Deployment (Backup)

If GitHub Actions is down or you need to deploy immediately:

```powershell
.\deploy-aircrew.ps1
```

##  Security Notes

- The SSH private key is encrypted in GitHub Secrets
- Only users with repository admin access can view/edit secrets
- The deployment key has minimal permissions (only deploy access)
- Consider using a non-root user for deployments (more secure)

##  Next Steps

After initial setup is complete:
1.  Remove manual deployment scripts (optional)
2.  Add deployment notifications (Slack, Discord, email)
3.  Set up staging environment with separate workflow
4.  Add automated testing before deployment
