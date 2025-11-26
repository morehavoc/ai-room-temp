#!/bin/bash
echo "Starting AI Room Temperature Frontend..."
cd frontend

# Try different serving options
if command -v npx >/dev/null 2>&1; then
    echo "✅ Using npx serve"
    npx serve . -p 8080 -s
elif command -v python3 >/dev/null 2>&1; then
    echo "✅ Using Python 3 built-in server"
    python3 -m http.server 8080
elif command -v python >/dev/null 2>&1; then
    echo "✅ Using Python built-in server"
    python -m http.server 8080
else
    echo "❌ No suitable web server found. Please install Node.js or Python."
    exit 1
fi
