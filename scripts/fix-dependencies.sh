#!/bin/bash

# Fix Dependencies Script
# This script fixes common dependency issues

echo "🔧 Fixing AI Room Temperature Dependencies..."
echo "============================================="

# Check if we're in the right directory
if [[ ! -f "backend/requirements.txt" ]]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Go to backend directory
cd backend

# Check if virtual environment exists
if [[ ! -d "venv" ]]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

echo "📥 Upgrading pip..."
pip install --upgrade pip

echo "📦 Uninstalling potentially conflicting packages..."
pip uninstall -y openai httpx

echo "📦 Installing updated dependencies..."
pip install -r requirements.txt

echo "✅ Dependencies updated successfully!"
echo ""
echo "You can now start the backend with:"
echo "  cd backend"
echo "  source venv/bin/activate  # or venv/Scripts/activate on Windows"
echo "  python app.py"