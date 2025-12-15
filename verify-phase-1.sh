#!/bin/bash

# Phase 1 Verification Script
# Ensures all Phase 1 files are created and working

echo "=========================================="
echo "PHASE 1: ERROR REPORTING FRAMEWORK"
echo "Verification & Safety Checks"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} File exists: $1"
    return 0
  else
    echo -e "${RED}✗${NC} File MISSING: $1"
    return 1
  fi
}

check_syntax() {
  if node -c "$1" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Syntax valid: $1"
    return 0
  else
    echo -e "${RED}✗${NC} Syntax ERROR: $1"
    return 1
  fi
}

# Check all Phase 1 files exist
echo "Checking Phase 1 files..."
echo ""

FILES=(
  "server/src/lib/errorCodes.js"
  "server/src/lib/errorLogger.js"
  "server/src/lib/enhancedError.js"
  "server/tests/errorReporting.test.js"
)

all_exist=true
for file in "${FILES[@]}"; do
  if ! check_file "$file"; then
    all_exist=false
  fi
done

echo ""
echo "Checking file syntax..."
echo ""

all_syntax_ok=true
for file in "${FILES[@]}"; do
  if ! check_syntax "$file"; then
    all_syntax_ok=false
  fi
done

echo ""
echo "=========================================="
echo "VERIFICATION RESULTS"
echo "=========================================="
echo ""

if [ "$all_exist" = true ] && [ "$all_syntax_ok" = true ]; then
  echo -e "${GREEN}✓ ALL PHASE 1 FILES CREATED AND VALID${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Run: npm test -- errorReporting.test.js"
  echo "  2. Verify all tests pass"
  echo "  3. Then proceed to Phase 2"
  echo ""
  exit 0
else
  echo -e "${RED}✗ PHASE 1 VALIDATION FAILED${NC}"
  echo ""
  echo "Issues found:"
  [ "$all_exist" = false ] && echo "  - Some files are missing"
  [ "$all_syntax_ok" = false ] && echo "  - Some files have syntax errors"
  echo ""
  exit 1
fi
