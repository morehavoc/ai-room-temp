# Deployment Guide

Complete deployment guide for the AI Room Temperature Monitor using single container Docker deployment.

## Prerequisites

- Docker installed
- OpenAI API key
- Modern web browser with microphone access

## Quick Deployment

### 1. Setup Environment

```bash
# Clone repository
git clone <repository-url>
cd ai-room-temp

# Create environment file
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### 2. Build and Run

```bash
# Build Docker image
docker build -t ai-room-temp .

# Run container
docker run -d -p 8080:80 --env-file .env --name ai-room-temp ai-room-temp

# Access at http://localhost:8080
```

### 3. Management Commands

```bash
# View logs
docker logs -f ai-room-temp

# Stop and remove
docker stop ai-room-temp && docker rm ai-room-temp

# Restart
docker restart ai-room-temp

# Update (rebuild and redeploy)
docker stop ai-room-temp && docker rm ai-room-temp
docker build -t ai-room-temp .
docker run -d -p 8080:80 --env-file .env --name ai-room-temp ai-room-temp
```

## Production Deployment

### Environment Configuration

Create production environment file:

```bash
cp .env.example .env.production
```

Configure production values:

```env
OPENAI_API_KEY=your_production_api_key
FLASK_DEBUG=false
FLASK_ENV=production
MAX_FILE_SIZE=25
```

### Production Deployment

```bash
# Use production port 80
docker run -d -p 80:80 --env-file .env.production --name ai-room-temp-prod ai-room-temp

# Or use custom port
docker run -d -p 8080:80 --env-file .env.production --name ai-room-temp-prod ai-room-temp
```

### SSL/HTTPS (Required for Microphone)

For production, you **must** use HTTPS for microphone access. Use a reverse proxy:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Cloud Deployment

### Docker-Compatible Platforms

The single container can be deployed on any Docker-compatible platform:

- **DigitalOcean App Platform**
- **Google Cloud Run**
- **AWS Fargate**
- **Azure Container Instances**
- **Railway**
- **Render**
- **Fly.io**

### Example: Railway Deployment

1. Connect your GitHub repository
2. Add environment variables:
   - `OPENAI_API_KEY`
   - `FLASK_DEBUG=false`
3. Railway will automatically build and deploy

### Example: Google Cloud Run

```bash
# Build and push to registry
docker build -t gcr.io/your-project/ai-room-temp .
docker push gcr.io/your-project/ai-room-temp

# Deploy
gcloud run deploy ai-room-temp \
  --image gcr.io/your-project/ai-room-temp \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=your_key,FLASK_DEBUG=false
```

## Development Setup

For development, you can also run components separately:

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python app.py

# Terminal 2: Frontend  
cd frontend
python -m http.server 8080
```

## Monitoring

### Health Checks

The application provides health endpoints:

- `http://localhost:8080/health` - Backend health
- `http://localhost:8080/api/health` - API routing health

### Logs

```bash
# View all logs
docker logs ai-room-temp

# Follow logs in real-time
docker logs -f ai-room-temp

# View only nginx logs
docker logs ai-room-temp | grep nginx

# View only Flask logs
docker logs ai-room-temp | grep flask
```

## Security

### Required for Production

1. **HTTPS**: Required for microphone access
2. **API Key Security**: Store in environment variables only
3. **CORS**: Configure allowed origins
4. **Content Security Policy**: Included in nginx config

### Optional Enhancements

- Rate limiting
- User authentication
- Request logging
- IP filtering

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs ai-room-temp

# Common issues:
# - Missing .env file
# - Invalid OpenAI API key  
# - Port 8080 already in use
```

### Microphone Not Working

- Ensure HTTPS in production
- Check browser permissions
- Try different browsers
- Verify microphone hardware

### API Errors

```bash
# Test OpenAI connection
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Check backend health
curl http://localhost:8080/health
```

### High OpenAI Costs

- Monitor usage in OpenAI dashboard
- Adjust recording interval in settings
- Implement session time limits

## Performance

### Resource Usage

The single container typically uses:
- **CPU**: 0.5-1 core during processing
- **Memory**: 512MB-1GB 
- **Storage**: 100MB (no persistent data)

### Scaling

For high usage:

```bash
# Run multiple instances on different ports
docker run -d -p 8081:80 --env-file .env --name ai-room-temp-1 ai-room-temp
docker run -d -p 8082:80 --env-file .env --name ai-room-temp-2 ai-room-temp

# Use nginx load balancer
upstream app {
    server localhost:8081;
    server localhost:8082;
}
```

## Backup

The application is stateless - no data backup needed. Only preserve:

- `.env` configuration files
- Docker image or source code
- SSL certificates (if used)