#!/bin/bash

echo "🧪 Testing Backend Connection"
echo "=============================="

# Check if port 5001 is available
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Backend is running on port 5001"
else
    echo "❌ Backend is not running on port 5001"
    echo "Please start the backend first:"
    echo "  cd backend && source venv/bin/activate && python app.py"
    exit 1
fi

echo ""
echo "🔍 Testing health endpoint..."
curl -v http://localhost:5001/health 2>&1 | grep -E "(HTTP/1\.|Access-Control|Server:|^HTTP)"

echo ""
echo "🔍 Testing CORS headers..."
curl -H "Origin: http://localhost:8080" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:5001/analyze-audio \
     -v 2>&1 | grep -E "(HTTP/1\.|Access-Control)"

echo ""
echo "✅ Backend test complete"