# Git Structure & Developer Guide

## Safe Code Organization

Your repository is organized to keep production code safe while making analysis available:

### 1. **Production Code** (`main` branch)
```bash
git clone https://github.com/webciters-dev/donors.git
cd donors
git checkout main  # Already the default
```

✅ **What's Here**: Complete, tested, working code deployed to aircrew.nl  
✅ **Status**: Production-ready (93% functionality verified)  
✅ **Safe to Use**: Yes - this is currently running on VPS  

---

### 2. **Revert to Exact Production State** (v1.0.0-production tag)

If anything breaks and you need to go back to the exact deployed version:

```bash
# See what's in the tag
git tag -l -n10

# Revert to production snapshot
git checkout v1.0.0-production

# OR: Create a branch from production snapshot
git checkout -b hotfix/from-production v1.0.0-production
```

⚡ **Emergency Use**: This captures the EXACT code running on VPS right now

---

### 3. **Analysis & Known Issues** (`analysis/codebase-issues` branch)

To see what issues were found during deep code review:

```bash
git checkout origin/analysis/codebase-issues
# or
git checkout analysis/codebase-issues
```

📋 **What's Here**:
- `CODEBASE_DEEP_ANALYSIS_REPORT.md` - 18 issues identified (6 critical, 6 high, 3 medium, 3 low)
- `VERSION_REFERENCE.md` - Exact environment versions

📌 **Important**: This branch contains ONLY documentation - NO code changes. Same code as main + analysis docs.

---

## Recommended Workflow

### For New Developers:

```bash
# 1. Clone the repository
git clone https://github.com/webciters-dev/donors.git
cd donors

# 2. You're on main (production code) - good!
# Install dependencies and set up local environment
npm install
npm run dev

# 3. When ready to work on improvements:
# a) Read the analysis to understand known issues
git fetch origin
git show origin/analysis/codebase-issues:CODEBASE_DEEP_ANALYSIS_REPORT.md | less

# OR: Temporarily check it out
git merge origin/analysis/codebase-issues
# (This adds the analysis docs to your working directory)

# Then create your own feature branch
git checkout -b feature/fix-issue-name
```

### For Bug Fixes:

```bash
# If something breaks in production:
git tag -l  # See production version
git checkout v1.0.0-production
git log --oneline -10  # See what was deployed

# Create hotfix from production snapshot
git checkout -b hotfix/critical-issue v1.0.0-production
# Fix the issue
git commit -m "hotfix: description"
git push origin hotfix/critical-issue
# Then create PR
```

### For Feature Development:

```bash
# Start from main (production code)
git checkout main
git pull origin main

# Read analysis to understand issues
git show origin/analysis/codebase-issues:CODEBASE_DEEP_ANALYSIS_REPORT.md

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test thoroughly
npm run dev
npm run build

# Commit with clear message
git commit -m "feat: description

Addresses issue #X from CODEBASE_DEEP_ANALYSIS_REPORT.md"

git push origin feature/your-feature-name
# Create PR for code review
```

---

## Branch Summary

| Branch | Purpose | Code Changes? | Use When |
|--------|---------|---------------|----------|
| `main` | Production code | ✅ Yes (deployed) | Daily development, pulling latest code |
| `v1.0.0-production` (tag) | Exact snapshot | ✅ Yes (never changes) | Emergency rollback, reference |
| `analysis/codebase-issues` | Known issues docs | ❌ No (docs only) | Planning fixes, understanding issues |

---

## Key Points

✅ **`main` is safe** - This is the code running on production VPS  
✅ **`v1.0.0-production` is immutable** - Can always revert to this  
✅ **`analysis/codebase-issues` is reference** - Read-only documentation of found issues  
❌ **Don't push to analysis branch** - It's for reference only  
✅ **Create feature branches** from main for your work  

---

## Common Commands

```bash
# See all branches and tags
git branch -a
git tag -l

# See what's in a remote branch
git show origin/analysis/codebase-issues:CODEBASE_DEEP_ANALYSIS_REPORT.md

# Compare production to current
git diff v1.0.0-production main
git log v1.0.0-production..main --oneline

# Create feature branch
git checkout -b feature/issue-fix-name

# Merge analysis docs into your branch for reference
git merge origin/analysis/codebase-issues --no-commit --no-ff
git reset HEAD CODEBASE_DEEP_ANALYSIS_REPORT.md VERSION_REFERENCE.md
git checkout -- CODEBASE_DEEP_ANALYSIS_REPORT.md VERSION_REFERENCE.md
# (This gives you the analysis files without committing them)
```

---

## Questions?

- **Which code should I use?** → `main` (default)
- **How do I see what issues were found?** → Check `analysis/codebase-issues` branch
- **How do I revert to production?** → `git checkout v1.0.0-production`
- **Can I edit the analysis branch?** → No, it's locked for reference
- **Where do I make my changes?** → Create new feature branches from `main`

---

**Last Updated**: December 14, 2025  
**Production Version**: v1.0.0-production (commit 5662ec3)  
**Analysis Available**: analysis/codebase-issues branch
