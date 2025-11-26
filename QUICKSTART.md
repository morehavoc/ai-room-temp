# Quick Start Guide

Get up and running with the AI Room Temperature Monitor in just a few minutes!

## Prerequisites

- Python 3.8+ 
- OpenAI API key
- Modern web browser

## 1. Setup Environment

```bash
# Clone the repository (if from git)
cd ai-room-temp

# Run the setup script
./scripts/setup.sh

# Copy environment template
cp .env.example .env
```

## 2. Configure OpenAI API Key

Edit the `.env` file and add your OpenAI API key:

```env
OPENAI_API_KEY=your_actual_openai_api_key_here
```

You can get an API key from: https://platform.openai.com/api-keys

## 3. Start the Application

### Option A: Auto Development Mode
```bash
./scripts/dev.sh
```
This starts both backend and frontend automatically.

### Option B: Manual Start (two terminals)

Terminal 1 (Backend):
```bash
cd backend
source venv/bin/activate  # or venv/Scripts/activate on Windows
python app.py
```

Terminal 2 (Frontend):
```bash
cd frontend
python -m http.server 8080
# OR: npx serve . -p 8080
```

### Option C: Docker Single Container (Recommended)
```bash
# Build and run everything in one container
./scripts/build-single.sh
docker-compose -f docker-compose.single.yml up -d
```

### Option D: Docker Multi-Container (Advanced)
```bash
docker-compose up
```

## 4. Open the Application

Navigate to: **http://localhost:8080**

**Note**: The backend runs on port 5001 (not 5000) to avoid conflicts with macOS AirPlay.

## 5. Start Monitoring

1. Click "**Start Monitoring**" button
2. Allow microphone access when prompted
3. Have a conversation near your device
4. Watch the thermometer fill up as the conversation gets "heated"!

## Features

- 🎙️ **Real-time recording** in 20-second chunks (configurable)
- 🤖 **AI analysis** using OpenAI Whisper + GPT
- 🌡️ **Visual thermometer** showing conversation "temperature"
- ⚙️ **Configurable settings** (recording interval, sensitivity)
- 📊 **Weighted averaging** with 15-minute decay window
- 💾 **Local storage** - survives browser refresh

## Troubleshooting

**Backend won't start?**
- Check your OpenAI API key in `.env`
- Make sure Python dependencies are installed: `pip install -r backend/requirements.txt`

**Microphone not working?**
- Allow microphone permissions in your browser
- Make sure you're using HTTPS in production
- Try a different browser

**Frontend can't connect?**
- Make sure backend is running on port 5000
- Check browser console for errors
- Verify API URL in frontend settings

**Need help?**
- Check `DEPLOYMENT.md` for detailed setup
- See `backend/README.md` and `frontend/README.md` for component details
- Look at `docs/ARCHITECTURE.md` for technical details

## Configuration

Access settings by clicking the **⚙️ Settings** button:

- **Recording Interval**: 10-60 seconds
- **Temperature Sensitivity**: How much recent readings affect the average
- **Debug Mode**: Shows technical details

## What Makes Conversations "Hot"?

The AI analyzes:
- **Emotional intensity** (anger, frustration, excitement)
- **Controversial topics** (politics, religion, sensitive subjects)  
- **Language tone** (argumentative, confrontational)
- **Overall discussion heat**

Scale: 1-100 (shown as thermometer fill level)
- **Cold (0-20)**: Calm, peaceful discussion
- **Cool (21-40)**: Normal conversation
- **Warm (41-70)**: Animated, some tension
- **Hot (71-100)**: Heated debate, strong emotions

Perfect for monitoring holiday family dinners! 🦃🔥