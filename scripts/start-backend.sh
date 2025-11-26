#!/bin/bash
echo "Starting AI Room Temperature Backend..."
cd backend

# Activate virtual environment
if [[ -d "venv" ]]; then
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
fi

# Check for .env file
if [[ ! -f "../.env" ]]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
set -a
source ../.env
set +a

# Check OpenAI API key
if [[ "$OPENAI_API_KEY" == "your_openai_api_key_here" ]] || [[ -z "$OPENAI_API_KEY" ]]; then
    echo "❌ Please set your OpenAI API key in .env file"
    exit 1
fi

echo "✅ Starting backend server on http://localhost:5000"
python app.py
