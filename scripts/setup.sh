#!/bin/bash

# AI Room Temperature Monitor - Setup Script
# This script helps set up the development environment

set -e

echo "🌡️ AI Room Temperature Monitor Setup"
echo "======================================"

# Check if running on macOS, Linux, or Windows (Git Bash)
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*|MINGW*|MSYS*) MACHINE=Windows;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "Detected OS: ${MACHINE}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo ""
echo "🔍 Checking prerequisites..."

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    echo "✅ Python 3 found: ${PYTHON_VERSION}"
    PYTHON_CMD="python3"
elif command_exists python; then
    PYTHON_VERSION=$(python --version | cut -d' ' -f2)
    if [[ $PYTHON_VERSION == 3.* ]]; then
        echo "✅ Python 3 found: ${PYTHON_VERSION}"
        PYTHON_CMD="python"
    else
        echo "❌ Python 3 required, found Python ${PYTHON_VERSION}"
        exit 1
    fi
else
    echo "❌ Python 3 not found. Please install Python 3.8 or higher."
    exit 1
fi

# Check pip
if command_exists pip3; then
    echo "✅ pip3 found"
    PIP_CMD="pip3"
elif command_exists pip; then
    echo "✅ pip found"
    PIP_CMD="pip"
else
    echo "❌ pip not found. Please install pip."
    exit 1
fi

# Check if we're in the project directory
if [[ ! -f "Dockerfile" ]] || [[ ! -d "backend" ]] || [[ ! -d "frontend" ]]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure looks good"

# Setup environment variables
echo ""
echo "🔧 Setting up environment..."

if [[ ! -f ".env" ]]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your OpenAI API key"
    
    # Try to open the .env file for editing
    if command_exists code; then
        echo "Opening .env in VS Code..."
        code .env
    elif command_exists nano; then
        echo "Opening .env in nano..."
        nano .env
    else
        echo "Please edit .env file manually and add your OpenAI API key"
    fi
else
    echo "✅ .env file already exists"
fi

# Check if OpenAI API key is set
if grep -q "your_openai_api_key_here" .env 2>/dev/null; then
    echo "⚠️  Remember to set your OpenAI API key in .env file"
fi

# Setup Python virtual environment
echo ""
echo "🐍 Setting up Python environment..."

if [[ ! -d "backend/venv" ]]; then
    echo "Creating virtual environment..."
    cd backend
    $PYTHON_CMD -m venv venv
    
    # Activate virtual environment
    if [[ "$MACHINE" == "Windows" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    
    echo "Installing Python dependencies..."
    # Upgrade pip first
    $PIP_CMD install --upgrade pip
    
    # Install dependencies
    $PIP_CMD install -r requirements.txt
    
    cd ..
    echo "✅ Python environment setup complete"
else
    echo "✅ Virtual environment already exists"
fi

# Check Docker (optional)
echo ""
echo "🐳 Checking Docker (optional)..."

if command_exists docker; then
    echo "✅ Docker found"
    echo "You can use the single container deployment:"
    echo "  docker build -t ai-room-temp ."
    echo "  docker run -d -p 8080:80 --env-file .env --name ai-room-temp ai-room-temp"
else
    echo "ℹ️  Docker not found. You can still run the application manually"
fi

# Check Node.js (for alternative frontend serving)
echo ""
echo "📦 Checking Node.js (optional)..."

if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js found: ${NODE_VERSION}"
    if command_exists npx; then
        echo "✅ npx found - you can use 'npx serve frontend' for frontend serving"
    fi
else
    echo "ℹ️  Node.js not found. You can use Python's built-in server for frontend"
fi

# Create startup scripts
echo ""
echo "📝 Creating startup scripts..."

# Backend startup script
cat > scripts/start-backend.sh << 'EOF'
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

echo "✅ Starting backend server on http://localhost:5001"
python app.py
EOF

# Frontend startup script
cat > scripts/start-frontend.sh << 'EOF'
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
EOF

# Make scripts executable
chmod +x scripts/start-backend.sh
chmod +x scripts/start-frontend.sh

echo "✅ Startup scripts created"

# Create development script
cat > scripts/dev.sh << 'EOF'
#!/bin/bash
echo "Starting AI Room Temperature in development mode..."

# Function to kill background processes
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend in background
./scripts/start-backend.sh &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend in background
./scripts/start-frontend.sh &
FRONTEND_PID=$!

echo ""
echo "🚀 Development servers started!"
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for processes
wait
EOF

chmod +x scripts/dev.sh

echo "✅ Development script created"

# Final instructions
echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure your OpenAI API key is set in .env file"
echo "2. Choose one of these options to start the application:"
echo ""
echo "Option A - Development mode (both servers):"
echo "   ./scripts/dev.sh"
echo ""
echo "Option B - Manual startup:"
echo "   ./scripts/start-backend.sh    # Terminal 1"
echo "   ./scripts/start-frontend.sh   # Terminal 2"
echo ""
echo "Option C - Docker (if available):"
echo "   docker build -t ai-room-temp ."
echo "   docker run -d -p 8080:80 --env-file .env --name ai-room-temp ai-room-temp"
echo ""
echo "Then open http://localhost:8080 in your browser!"
echo ""
echo "📖 For detailed documentation, see README.md"