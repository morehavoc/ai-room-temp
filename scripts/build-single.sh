#!/bin/bash

# Build and run single container setup
echo "🐳 Building AI Room Temperature - Single Container"
echo "=================================================="

# Check if .env file exists
if [[ ! -f ".env" ]]; then
    echo "❌ .env file not found. Creating from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your OpenAI API key before running"
    exit 1
fi

# Check if OpenAI API key is set
if grep -q "your_openai_api_key_here" .env 2>/dev/null; then
    echo "❌ Please set your OpenAI API key in .env file"
    exit 1
fi

echo "🏗️  Building single container..."
docker build -t ai-room-temp .

if [[ $? -eq 0 ]]; then
    echo "✅ Build successful!"
    echo ""
    echo "To run the container:"
    echo "  docker run -d -p 8080:80 --env-file .env --name ai-room-temp ai-room-temp"
    echo ""
    echo "The application will be available at: http://localhost:8080"
    echo ""
    echo "To check logs:"
    echo "  docker logs -f ai-room-temp"
    echo ""
    echo "To stop:"
    echo "  docker stop ai-room-temp && docker rm ai-room-temp"
else
    echo "❌ Build failed!"
    exit 1
fi