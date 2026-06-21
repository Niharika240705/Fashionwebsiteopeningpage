#!/bin/bash
echo "🚀 Starting Both Servers..."
echo ""
echo "Backend will start in background..."
cd "$(dirname "$0")/server"
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
echo ""

sleep 3

echo "Frontend starting..."
cd "$(dirname "$0")"
npm run dev

# When frontend stops, kill backend
kill $BACKEND_PID 2>/dev/null
