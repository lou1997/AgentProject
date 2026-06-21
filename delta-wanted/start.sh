#!/bin/bash
echo "Starting Delta Wanted..."
echo "Backend on :3001, Frontend on :5180"

cd /workspace/delta-wanted/backend && node server.js &
BACKEND_PID=$!

cd /workspace/delta-wanted/frontend && npx vite --host 0.0.0.0 --port 5180

trap "kill $BACKEND_PID" EXIT
