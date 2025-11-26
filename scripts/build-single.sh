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
docker-compose -f docker-compose.single.yml build

if [[ $? -eq 0 ]]; then
    echo "✅ Build successful!"
    echo ""
    echo "To run the container:"
    echo "  docker-compose -f docker-compose.single.yml up"
    echo ""
    echo "Or to run in background:"
    echo "  docker-compose -f docker-compose.single.yml up -d"
    echo ""
    echo "The application will be available at: http://localhost:8080"
    echo ""
    echo "To stop:"
    echo "  docker-compose -f docker-compose.single.yml down"
else
    echo "❌ Build failed!"
    exit 1
fi