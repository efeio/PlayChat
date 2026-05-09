#!/bin/bash

# E2E Test Runner Script for PlayChat
# This script starts all required servers and runs the E2E test suite

set -e

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║                    PlayChat E2E Test Suite Runner                            ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if servers are already running
check_server() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${GREEN}✓${NC} $name is already running on port $port"
        return 0
    else
        echo -e "${RED}✗${NC} $name is not running on port $port"
        return 1
    fi
}

echo "Checking server status..."
echo ""

AUTH_RUNNING=false
BACKEND_RUNNING=false
FRONTEND_RUNNING=false

if check_server 3000 "Auth Server"; then
    AUTH_RUNNING=true
fi

if check_server 3001 "Backend Server"; then
    BACKEND_RUNNING=true
fi

if check_server 5173 "Frontend Dev Server"; then
    FRONTEND_RUNNING=true
fi

echo ""

# Start servers if not running
if [ "$AUTH_RUNNING" = false ] || [ "$BACKEND_RUNNING" = false ] || [ "$FRONTEND_RUNNING" = false ]; then
    echo -e "${YELLOW}⚠${NC}  Some servers are not running. Please start them manually:"
    echo ""
    
    if [ "$AUTH_RUNNING" = false ]; then
    fi
    
    if [ "$BACKEND_RUNNING" = false ]; then
        echo "  Terminal 2: cd backend && npm run dev"
    fi
    
    if [ "$FRONTEND_RUNNING" = false ]; then
        echo "  Terminal 3: cd frontend && npm run dev"
    fi
    
    echo ""
    echo "After starting the servers, run this script again."
    exit 1
fi

echo -e "${GREEN}✓${NC} All servers are running!"
echo ""

# Ask which tests to run
echo "Select test suite to run:"
echo "  1) Smoke tests only (~30 seconds)"
echo "  2) Full disconnect timeout suite (~15-20 minutes)"
echo "  3) Hangman disconnect tests (~3-4 minutes)"
echo "  4) Spectator disconnect tests (~2-3 minutes)"
echo "  5) All tests (~20-25 minutes)"
echo ""
read -p "Enter choice [1-5]: " choice

cd frontend

case $choice in
    1)
        echo ""
        echo "Running smoke tests..."
        npm run test:e2e -- smoke.spec.ts --reporter=line
        ;;
    2)
        echo ""
        echo "Running disconnect timeout tests..."
        echo -e "${YELLOW}⚠${NC}  This will take 15-20 minutes..."
        npm run test:e2e -- disconnect-timeout.spec.ts --reporter=line
        ;;
    3)
        echo ""
        echo "Running Hangman disconnect tests..."
        npm run test:e2e -- hangman-disconnect.spec.ts --reporter=line
        ;;
    4)
        echo ""
        echo "Running spectator disconnect tests..."
        npm run test:e2e -- spectator-disconnect.spec.ts --reporter=line
        ;;
    5)
        echo ""
        echo "Running all E2E tests..."
        echo -e "${YELLOW}⚠${NC}  This will take 20-25 minutes..."
        npm run test:e2e -- --reporter=line
        ;;
    *)
        echo -e "${RED}✗${NC} Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║                         Tests Complete!                                      ║"
echo "║                                                                              ║"
echo "║  View detailed HTML report: npx playwright show-report                       ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
