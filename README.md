# AI Room Temperature Monitor

A real-time conversation temperature monitoring application that records audio, transcribes it using AI, and displays how "heated" the discussion is getting on a visual thermometer.

Perfect for monitoring holiday family dinners, meetings, or any conversation where you want to track the emotional intensity!

## Features

- 🎙️ **Real-time Audio Recording**: Continuous audio capture in configurable intervals (10-60 seconds)
- 🤖 **AI-Powered Analysis**: Uses OpenAI to transcribe and analyze emotional intensity and controversial topics
- 🌡️ **Visual Thermometer**: Classic bulb-style thermometer that fills up as conversations get "hotter"
- ⏰ **Time-Weighted Averaging**: Recent conversations have more impact, with 15-minute decay window
- 🔒 **Privacy-First**: No audio storage on server, immediate deletion after processing
- 💾 **Local Persistence**: Temperature history survives browser refresh via localStorage
- ⚙️ **Configurable Settings**: Adjustable recording intervals and sensitivity

## Architecture

### Frontend (Vanilla JavaScript)
- Web Audio API for microphone capture
- SVG-based thermometer visualization
- Local storage for temperature history management
- Time-decay weighted averaging algorithm

### Backend (Python Flask)
- Single stateless endpoint for audio analysis
- OpenAI Whisper for transcription
- OpenAI GPT for temperature scoring (1-100 scale)
- Immediate audio file cleanup

### Data Flow
```
Browser → Record Audio → Send to Server → Transcribe → Analyze → Return Score → Update Thermometer
    ↑                                                                              ↓
LocalStorage ← Calculate Weighted Average ← Apply Time Decay ← Store Temperature History
```

## Quick Start

### Prerequisites
- Docker or Python 3.8+
- OpenAI API key
- Modern web browser with microphone access

### Setup (Docker - Recommended)

1. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

2. **Build and run:**
   ```bash
   docker build -t ai-room-temp .
   docker run -d -p 8080:80 --env-file .env --name ai-room-temp ai-room-temp
   ```

3. **Access application:**
   - Navigate to `http://localhost:8080`
   - Grant microphone permissions
   - Start monitoring conversation temperature!

### Alternative: Development Setup

For development or if Docker is not available:
```bash
# Backend
cd backend && pip install -r requirements.txt
export OPENAI_API_KEY=your_api_key_here && python app.py

# Frontend (new terminal)
cd frontend && python -m http.server 8080
```

## Configuration

- **Recording Interval**: 10-60 seconds (configurable in UI)
- **Temperature Decay**: 15-minute sliding window
- **Analysis Criteria**: Emotional intensity + controversial topic detection
- **Scale**: 1-100 (hidden from UI, shown as thermometer fill level)

## Privacy & Security

- **No Data Persistence**: Server stores no conversation data
- **Immediate Cleanup**: Audio files deleted after processing
- **Local-Only History**: Temperature data stays in browser localStorage
- **Stateless Design**: Each request is independent

## Development

See individual README files in `/backend` and `/frontend` directories for detailed development instructions.

## License

MIT License - feel free to use for your holiday gatherings!