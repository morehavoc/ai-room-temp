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
