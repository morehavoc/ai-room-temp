# Deployment Guide

This guide covers different deployment options for the AI Room Temperature Monitor.

## Quick Start (Development)

1. **Clone and setup:**
   ```bash
   git clone <repository>
   cd ai-room-temp
   ./scripts/setup.sh
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Start development servers:**
   ```bash
   ./scripts/dev.sh
   # OR manually:
   ./scripts/start-backend.sh    # Terminal 1
   ./scripts/start-frontend.sh   # Terminal 2
   ```

4. **Open application:**
   - Frontend: http://localhost:8080
   - Backend: http://localhost:5000

## Docker Deployment

### Single Container (Recommended)

The simplest deployment uses one container with both frontend and backend:

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your OpenAI API key

# Build and run single container
docker build -t ai-room-temp .
docker run -d -p 8080:80 --env-file .env --name ai-room-temp ai-room-temp

# Access application at http://localhost:8080
```

### Multi-Container Setup

For development or when you need separate frontend/backend scaling:

#### Development with Docker

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your OpenAI API key

# Start container
docker run -d -p 8080:80 --env-file .env --name ai-room-temp ai-room-temp

# View logs
docker logs -f ai-room-temp

# Stop container
docker stop ai-room-temp && docker rm ai-room-temp
```

### Production Docker Deployment

1. **Create production environment file:**
   ```bash
   cp .env.example .env.prod
   ```

2. **Configure for production:**
   ```env
   OPENAI_API_KEY=your_production_api_key
   FLASK_DEBUG=false
   CORS_ORIGINS=https://yourdomain.com
   MAX_FILE_SIZE=25
   ```

3. **Deploy with production environment:**
   ```bash
   docker run -d -p 80:80 --env-file .env.production --name ai-room-temp-prod ai-room-temp
   ```

## Cloud Deployment

### Heroku

1. **Backend deployment:**
   ```bash
   cd backend
   # Create Heroku app
   heroku create your-app-name-backend
   
   # Set environment variables
   heroku config:set OPENAI_API_KEY=your_key
   heroku config:set FLASK_DEBUG=false
   
   # Deploy
   git add .
   git commit -m "Deploy backend"
   git push heroku main
   ```

2. **Frontend deployment (Netlify/Vercel):**
   - Upload `frontend/` directory to static hosting
   - Configure frontend to use your backend URL
   - Ensure HTTPS for microphone access

### AWS/Google Cloud/Azure

#### Backend (Container Service)

1. **Build and push image:**
   ```bash
   # AWS ECR example
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
   
   docker build -t room-temp-backend ./backend
   docker tag room-temp-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/room-temp-backend:latest
   docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/room-temp-backend:latest
   ```

2. **Deploy to container service:**
   - AWS ECS/Fargate
   - Google Cloud Run
   - Azure Container Instances

3. **Set environment variables:**
   ```
   OPENAI_API_KEY=your_key
   PORT=5000
   CORS_ORIGINS=https://your-frontend-domain.com
   ```

#### Frontend (Static Hosting)

1. **Deploy to static hosting:**
   - AWS S3 + CloudFront
   - Google Cloud Storage
   - Azure Static Web Apps
   - Netlify
   - Vercel

2. **Update API URL:**
   ```javascript
   // frontend/scripts/app.js
   this.API_BASE_URL = 'https://your-backend-url.com';
   ```

## Security Considerations

### HTTPS Requirements
- **Critical:** Microphone access requires HTTPS in production
- Use SSL certificates (Let's Encrypt, CloudFlare, etc.)
- Configure proper CORS headers

### API Security
- Keep OpenAI API key secure (environment variables only)
- Implement rate limiting if needed
- Consider API authentication for production use

### Content Security Policy
```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline'; 
  style-src 'self' 'unsafe-inline'; 
  connect-src 'self' https://your-backend.com; 
  media-src 'self' blob:;
```

## Monitoring and Logging

### Backend Monitoring
- Monitor API response times
- Track OpenAI API usage and costs
- Set up error alerting
- Log audio processing metrics

### Frontend Monitoring
- Browser console errors
- Microphone permission failures
- API connection issues

### Recommended Tools
- **Logging:** Sentry, LogRocket
- **Monitoring:** DataDog, New Relic
- **Uptime:** Pingdom, UptimeRobot

## Performance Optimization

### Backend
- Use production WSGI server (Gunicorn)
- Implement connection pooling
- Add Redis for caching (if needed)
- Scale horizontally behind load balancer

### Frontend
- Enable gzip compression
- Use CDN for static assets
- Implement service worker for offline capability
- Optimize audio chunk sizes

## Troubleshooting

### Common Issues

**Backend not starting:**
```bash
# Check environment variables
env | grep OPENAI_API_KEY

# Check logs
docker logs ai-room-temp

# Test OpenAI connection
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

**Frontend can't connect:**
- Check CORS configuration
- Verify API URL in frontend code
- Test backend health endpoint: `/health`

**Microphone not working:**
- Ensure HTTPS in production
- Check browser permissions
- Test on different browsers

**High OpenAI costs:**
- Monitor audio chunk sizes
- Implement user session limits
- Add request queuing/throttling

## Scaling

### Horizontal Scaling
- Deploy multiple backend instances
- Use load balancer (nginx, HAProxy, cloud LB)
- Share session state if needed

### Database (if added)
- PostgreSQL for user data
- Redis for session storage
- Time-series DB for temperature history

### CDN and Caching
- Static assets via CDN
- API response caching
- Audio file temporary storage

## Backup and Recovery

### Data Backup
- User settings (localStorage)
- Temperature history (if persisted)
- Application configuration

### Disaster Recovery
- Automated deployments
- Infrastructure as code
- Database backups (if applicable)

## Cost Optimization

### OpenAI API Costs
- Monitor usage with alerts
- Implement user limits
- Use shorter audio chunks
- Cache similar requests (if applicable)

### Infrastructure Costs
- Use spot instances for development
- Implement auto-scaling
- Monitor resource usage
- Use free tiers where possible