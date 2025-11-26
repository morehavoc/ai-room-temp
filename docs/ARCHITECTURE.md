# System Architecture

## Overview

The AI Room Temperature Monitor is designed as a privacy-first, stateless application that analyzes conversation "temperature" in real-time.

## System Components

### Frontend Application
**Technology**: Vanilla JavaScript, HTML5, CSS3
**Location**: `/frontend/`

#### Responsibilities
- **Audio Capture**: Uses Web Audio API to record microphone input
- **Chunk Management**: Configurable recording intervals (10-60 seconds)
- **Data Transmission**: Sends audio chunks to backend via HTTP POST
- **Temperature Calculation**: Maintains weighted average with time decay
- **Visualization**: SVG-based thermometer display
- **Persistence**: localStorage for temperature history
- **User Interface**: Settings panel, status indicators, controls

#### Key Components
- `AudioRecorder`: Handles microphone access and recording
- `TemperatureManager`: Calculates weighted averages and time decay
- `ThermometerDisplay`: Renders and animates the temperature visualization
- `SettingsManager`: Handles user configuration
- `StatusIndicator`: Shows recording/processing/error states

### Backend API Server
**Technology**: Python Flask
**Location**: `/backend/`

#### Responsibilities
- **Audio Processing**: Accepts multipart form uploads
- **Transcription**: OpenAI Whisper API integration
- **Analysis**: OpenAI GPT for temperature scoring
- **Response**: Returns JSON with temperature score (1-100)
- **Cleanup**: Immediate file deletion after processing

#### Endpoint Specification
```
POST /analyze-audio
Content-Type: multipart/form-data
Body: audio file (WAV/MP3/etc.)

Response:
{
  "temperature": 75,
  "confidence": 0.85,
  "timestamp": "2023-11-22T10:30:00Z"
}
```

## Data Flow Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Browser       │    │   Backend API    │    │   OpenAI APIs   │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │AudioRecorder│ │───▶│ │ /analyze-    │ │───▶│ │   Whisper   │ │
│ └─────────────┘ │    │ │  audio       │ │    │ │Transcription│ │
│                 │    │ └──────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │         │        │    │        │        │
│ │Temperature  │ │◀───│         ▼        │    │        ▼        │
│ │Manager      │ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ └─────────────┘ │    │ │   Analysis   │ │◀───│ │     GPT     │ │
│        │        │    │ │   Engine     │ │    │ │  Analysis   │ │
│        ▼        │    │ └──────────────┘ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │         │        │    └─────────────────┘
│ │Thermometer  │ │    │         ▼        │
│ │Display      │ │    │ ┌──────────────┐ │
│ └─────────────┘ │    │ │ File Cleanup │ │
│        │        │    │ └──────────────┘ │
│        ▼        │    └──────────────────┘
│ ┌─────────────┐ │
│ │localStorage │ │
│ └─────────────┘ │
└─────────────────┘
```

## Temperature Calculation Algorithm

### Backend Analysis
The backend uses OpenAI GPT to analyze transcribed text for:
1. **Emotional Intensity**: Anger, frustration, excitement levels
2. **Controversial Topics**: Politics, religion, sensitive subjects
3. **Conversation Tone**: Heated debate vs. calm discussion
4. **Language Patterns**: Interruptions, raised voices, argumentative language

### Frontend Weighted Average
The frontend maintains a rolling average using time decay:

```javascript
function calculateWeightedTemperature(readings, currentTime) {
  const DECAY_MINUTES = 15;
  const weights = readings.map(reading => {
    const ageMinutes = (currentTime - reading.timestamp) / 60000;
    return Math.max(0, 1 - (ageMinutes / DECAY_MINUTES));
  });
  
  const weightedSum = readings.reduce((sum, reading, i) => 
    sum + (reading.temperature * weights[i]), 0);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
```

## Security & Privacy Considerations

### Data Handling
- **No Persistent Storage**: Backend stores no audio or conversation data
- **Immediate Cleanup**: Audio files deleted within seconds of processing
- **Stateless Design**: Each request is completely independent
- **Local Storage Only**: Temperature history remains in browser

### API Security
- **Input Validation**: File type and size restrictions
- **Rate Limiting**: Prevent abuse of transcription services
- **Error Handling**: No sensitive information in error responses
- **CORS Configuration**: Restrict origins in production

### Browser Security
- **Microphone Permissions**: Required user consent
- **HTTPS Only**: Secure audio transmission
- **Content Security Policy**: XSS prevention
- **Local Storage Encryption**: Optional for sensitive deployments

## Scalability Considerations

### Frontend
- **Offline Capability**: Continue recording during network outages
- **Queue Management**: Handle multiple pending requests
- **Memory Management**: Prevent audio buffer overflow
- **Progressive Enhancement**: Graceful degradation for older browsers

### Backend
- **Horizontal Scaling**: Stateless design enables load balancing
- **Async Processing**: Non-blocking audio analysis
- **Resource Limits**: File size and processing time constraints
- **Circuit Breaker**: Handle OpenAI API failures gracefully

## Deployment Architecture

### Development
```
Frontend: http://localhost:8080 (static files)
Backend:  http://localhost:5000 (Flask dev server)
```

### Production
```
Frontend: CDN/Static hosting (Vercel, Netlify, S3)
Backend:  Container deployment (Docker, K8s, Cloud Run)
Load Balancer: SSL termination and routing
```

## Technology Choices Rationale

### Frontend: Vanilla JavaScript
- **Simplicity**: No build process or framework complexity
- **Performance**: Minimal overhead for real-time audio processing
- **Compatibility**: Works across all modern browsers
- **Maintainability**: Easy to understand and modify

### Backend: Python Flask
- **Rapid Development**: Quick API development and testing
- **OpenAI Integration**: Excellent Python SDK support
- **Simplicity**: Minimal dependencies and configuration
- **Audio Processing**: Good library ecosystem

### Database: None (localStorage only)
- **Privacy**: No server-side data persistence
- **Simplicity**: Eliminates database setup and management
- **Scalability**: Stateless design enables easy scaling
- **Performance**: No database query overhead