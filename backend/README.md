# Backend API Server

The backend is a Python Flask application that provides a single endpoint for analyzing audio and returning conversation temperature scores.

## Features

- **Audio Processing**: Accepts various audio formats (WAV, MP3, M4A, etc.)
- **AI Transcription**: Uses OpenAI Whisper for speech-to-text
- **Temperature Analysis**: Uses OpenAI GPT to score conversation "heat" (1-100)
- **Stateless Design**: No data persistence, immediate file cleanup
- **Privacy-First**: Audio files deleted immediately after processing

## Setup

### Prerequisites
- Python 3.8 or higher
- OpenAI API key

### Installation

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   ```bash
   export OPENAI_API_KEY=your_openai_api_key_here
   # Optional: set custom port
   export PORT=5000
   ```

3. **Run the server:**
   ```bash
   python app.py
   ```

The server will start on `http://localhost:5001`

## API Documentation

### Analyze Audio
Processes audio and returns a conversation temperature score.

**Endpoint:** `POST /analyze-audio`

**Request:**
- Content-Type: `multipart/form-data`
- Body: Audio file in `audio` field

**Response:**
```json
{
  "temperature": 75,
  "confidence": 0.85,
  "timestamp": "2023-11-22T10:30:00Z",
  "analysis_summary": "Moderate heated discussion detected with political topics"
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad request (missing file, invalid format)
- `500`: Internal server error (OpenAI API issues, processing errors)

### Health Check
Simple endpoint to verify server is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-11-22T10:30:00Z"
}
```

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: Required - Your OpenAI API key
- `PORT`: Optional - Server port (default: 5001)
- `MAX_FILE_SIZE`: Optional - Max audio file size in MB (default: 25)
- `ALLOWED_EXTENSIONS`: Optional - Comma-separated audio extensions

### Audio Processing Limits
- Maximum file size: 25MB
- Supported formats: WAV, MP3, M4A, FLAC, OGG
- Maximum duration: 5 minutes (to control processing costs)

## Development

### Running in Development Mode
```bash
export FLASK_ENV=development
export FLASK_DEBUG=1
python app.py
```

### Testing the API
```bash
# Using curl
curl -X POST \
  -F "audio=@test_audio.wav" \
  http://localhost:5001/analyze-audio

# Using Python requests
import requests
with open('test_audio.wav', 'rb') as f:
    response = requests.post(
        'http://localhost:5001/analyze-audio',
        files={'audio': f}
    )
    print(response.json())
```

### Project Structure
```
backend/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── audio_processor.py  # Audio processing utilities
├── temperature_analyzer.py # AI analysis logic
├── config.py          # Configuration settings
└── tests/             # Test files
    ├── test_api.py    # API endpoint tests
    └── fixtures/      # Test audio files
```

## Deployment

### Docker
```bash
docker build -t room-temp-backend .
docker run -e OPENAI_API_KEY=your_key -p 5001:5001 room-temp-backend
```

### Production Considerations
- Use a production WSGI server (Gunicorn, uWSGI)
- Configure proper logging
- Set up health checks and monitoring
- Implement rate limiting
- Use HTTPS in production
- Configure CORS for your frontend domain

### Example Production Deployment
```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn --bind 0.0.0.0:5001 --workers 4 app:app
```

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Invalid file format",
  "details": "Supported formats: wav, mp3, m4a, flac, ogg",
  "timestamp": "2023-11-22T10:30:00Z"
}
```

Common errors:
- Missing audio file in request
- Unsupported file format
- File too large
- OpenAI API errors (rate limits, invalid key)
- Audio processing failures

## Security

- **Input Validation**: File type and size restrictions
- **Temporary Files**: Secure temporary directory usage
- **File Cleanup**: Guaranteed cleanup even on errors
- **No Data Persistence**: Files deleted immediately
- **Error Sanitization**: No sensitive info in error messages

## Monitoring

### Logs
The application logs important events:
- Audio file processing start/end
- OpenAI API calls and responses
- Error conditions
- File cleanup operations

### Metrics
Consider tracking:
- Request volume and response times
- OpenAI API usage and costs
- Error rates by type
- Audio processing duration

## Troubleshooting

### Common Issues

**OpenAI API Key Issues:**
```bash
# Verify your API key is set
echo $OPENAI_API_KEY
# Test API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

**Audio Processing Errors:**
- Ensure audio file is valid and not corrupted
- Check file size limits
- Verify supported format

**Memory Issues:**
- Large audio files may cause memory problems
- Consider implementing streaming for large files
- Monitor system resources during processing