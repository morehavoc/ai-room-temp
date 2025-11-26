#!/bin/bash

echo "🧪 Testing Single Container Deployment"
echo "======================================"

# Check if container is running
if ! docker-compose -f docker-compose.single.yml ps | grep -q "Up"; then
    echo "❌ Container is not running. Start it with:"
    echo "   docker-compose -f docker-compose.single.yml up -d"
    exit 1
fi

echo "✅ Container is running"
echo ""

# Test frontend
echo "🌐 Testing frontend..."
if curl -s -f http://localhost:8080 > /dev/null; then
    echo "✅ Frontend accessible at http://localhost:8080"
else
    echo "❌ Frontend not accessible"
fi

echo ""

# Test backend health
echo "🔧 Testing backend health..."
if curl -s -f http://localhost:8080/health > /dev/null; then
    echo "✅ Backend health endpoint working"
    
    # Show health response
    echo "Health response:"
    curl -s http://localhost:8080/health | jq . 2>/dev/null || curl -s http://localhost:8080/health
else
    echo "❌ Backend health endpoint not working"
fi

echo ""

# Test API endpoint
echo "🔌 Testing API routing..."
if curl -s -f http://localhost:8080/api/health > /dev/null; then
    echo "✅ API routing working through nginx proxy"
else
    echo "❌ API routing not working"
fi

echo ""
echo "🎉 Single container test complete!"
echo ""
echo "If all tests passed, your single container is working correctly."
echo "Access the application at: http://localhost:8080"