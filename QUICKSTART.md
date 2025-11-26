# Quick Start Guide

Get the AI Room Temperature Monitor running in under 5 minutes!

## Prerequisites

- Docker (recommended) or Python 3.8+
- OpenAI API key from https://platform.openai.com/api-keys
- Modern web browser with microphone support

## 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=your_actual_openai_api_key_here
```

## 2. Start the Application

### Docker (Recommended)
```bash
docker build -t ai-room-temp .
docker run -d -p 8080:80 --env-file .env --name ai-room-temp ai-room-temp
```

### Development Mode (Alternative)
```bash
# Setup script handles dependencies
./scripts/setup.sh
./scripts/dev.sh
```

## 3. Open and Use

1. Navigate to **http://localhost:8080**
2. Grant microphone permissions when prompted
3. Click "**Start Monitoring**"
4. Have a conversation and watch the temperature rise!

## Features & Configuration

- 🎙️ **Real-time recording** in configurable intervals (10-60 seconds)
- 🤖 **AI analysis** using OpenAI Whisper + GPT for conversation temperature
- 🌡️ **Visual thermometer** with heat-based colors and timeline graph
- ⚙️ **Settings panel** for recording intervals and sensitivity
- 📊 **Weighted averaging** with 15-minute decay window
- 💾 **Local storage** - temperature history survives browser refresh

## Troubleshooting

- **Backend won't start?** Check OpenAI API key in `.env`
- **Microphone not working?** Allow browser permissions, use HTTPS in production  
- **Connection issues?** Ensure backend is running, check browser console
- **Need detailed help?** See `DEPLOYMENT.md` and `TROUBLESHOOTING.md`

## What Makes Conversations "Hot"?

The AI analyzes emotional intensity, controversial topics, and language tone:
- **Cool (0-40)**: Calm, normal conversation
- **Warm (41-70)**: Animated discussion, some tension
- **Hot (71-100)**: Heated debate, strong emotions

Perfect for monitoring holiday family dinners! 🦃🔥