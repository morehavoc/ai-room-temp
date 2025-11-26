# Single Container Deployment

This guide covers deploying the AI Room Temperature Monitor as a single Docker container.

## Overview

The single container deployment packages both the frontend (nginx) and backend (Python Flask) into one container using:

- **nginx**: Serves static frontend files and proxies API requests
- **Flask**: Handles AI processing on internal port 5001  
- **Supervisor**: Manages both processes within the container

## Quick Start

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your OpenAI API key

# 2. Build and run
docker build -t ai-room-temp .
docker run -d -p 8080:80 --env-file .env --name ai-room-temp ai-room-temp

# 3. Test deployment
./scripts/test-single-container.sh

# 4. Access application
open http://localhost:8080
```

## Architecture

```
┌─────────────────────────────────────────────┐
│              Docker Container               │
│  ┌───────────┐    ┌─────────────────────┐   │
│  │   nginx   │────│   Flask Backend     │   │
│  │   :8080   │    │   (127.0.0.1:5001)  │   │
│  └───────────┘    └─────────────────────┘   │
│       │                      │              │
│   Static Files          OpenAI API          │
│   (frontend/)           Processing          │
└─────────────────────────────────────────────┘
```

### Request Flow

1. **Frontend requests** → nginx serves static files from `/app/frontend/`
2. **API requests** to `/api/*` → nginx proxies to `127.0.0.1:5001`
3. **Health checks** at `/health` → nginx proxies to Flask directly
4. **Flask backend** processes audio and returns temperature data

## Configuration

### Environment Variables

Set in `.env` file:
```env
OPENAI_API_KEY=your_key_here
FLASK_DEBUG=false
MAX_FILE_SIZE=25
PORT=5001  # Internal Flask port
```

### Nginx Configuration

Located at `docker/nginx.conf`:
- Serves frontend on port 8080
- Proxies `/api/*` requests to Flask
- Handles CORS headers
- Enables gzip compression

### Supervisor Configuration

Located at `docker/supervisord.conf`:
- Manages nginx and Flask processes
- Auto-restarts on failure
- Centralized logging

## Build Process

```dockerfile
# Dockerfile highlights:
FROM python:3.11-slim
RUN apt-get install nginx supervisor curl
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY docker/nginx.conf /etc/nginx/sites-available/default
CMD ["/usr/bin/supervisord"]
```

## Management Commands

### Build and Start
```bash
# Build image
docker build -t ai-room-temp .

# Start container
docker run -d -p 8080:80 --env-file .env --name ai-room-temp ai-room-temp
```

### Monitoring
```bash
# View logs
docker logs -f ai-room-temp

# Check status
docker ps

# Test endpoints
./scripts/test-single-container.sh
```

### Stopping
```bash
# Stop and remove container
docker stop ai-room-temp && docker rm ai-room-temp

# Or stop all containers
docker stop $(docker ps -q)
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs for errors
docker logs ai-room-temp

# Common issues:
# - Missing .env file
# - Invalid OpenAI API key
# - Port 8080 already in use
```

### Frontend Not Loading
```bash
# Check nginx status
docker exec -it <container_name> supervisorctl status nginx

# Check nginx logs
docker logs ai-room-temp | grep nginx
```

### Backend Not Responding
```bash
# Check Flask status
docker exec -it <container_name> supervisorctl status flask

# Test Flask directly
docker exec -it <container_name> curl http://127.0.0.1:5001/health
```

### API Requests Failing
```bash
# Test nginx proxy
curl -v http://localhost:8080/api/health

# Check CORS headers
curl -H "Origin: http://localhost:8080" http://localhost:8080/api/health -v
```

## Production Deployment

### Resource Requirements
- **CPU**: 1-2 cores
- **Memory**: 2-4 GB RAM
- **Storage**: 1 GB (for container + temp files)

### Scaling Considerations
- Single container limits to vertical scaling
- For high load, consider multi-container setup
- Add load balancer for multiple instances

### Security
```bash
# Use non-root user (add to Dockerfile)
RUN useradd -m appuser
USER appuser

# Restrict nginx configuration
# Remove server tokens
server_tokens off;
```

### Environment-Specific Configs
```bash
# Production: Create .env.production file
FLASK_DEBUG=false
FLASK_ENV=production
OPENAI_API_KEY=your_production_key_here

# Then use it when running:
docker run -d -p 8080:80 --env-file .env.production --name ai-room-temp ai-room-temp
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G
```

## Advantages of Single Container

✅ **Simple deployment**: One container to manage
✅ **Lower resource usage**: No inter-container networking
✅ **Faster startup**: Everything in one place  
✅ **Easy port management**: Only expose port 8080
✅ **Simplified networking**: No container-to-container communication

## Disadvantages

❌ **Less flexible scaling**: Can't scale frontend/backend separately
❌ **Coupled deployments**: Must redeploy both on any change
❌ **Resource contention**: nginx and Flask share resources
❌ **More complex container**: Multiple processes in one container

## When to Use

**Use single container when**:
- Simple deployment requirements
- Low to medium traffic
- Minimal operational overhead desired
- Single server deployment

**Use multi-container when**:
- Need independent scaling
- High traffic requirements  
- Microservices architecture
- Complex CI/CD pipelines