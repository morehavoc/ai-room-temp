# Troubleshooting Guide

Common issues and solutions for the AI Room Temperature Monitor.

## 🚨 Backend Startup Issues

### Error: `TypeError: Client.__init__() got an unexpected keyword argument 'proxies'`

**Problem**: Incompatible OpenAI library version causing httpx client conflicts.

**Solution**:
```bash
# Run the dependency fix script
./scripts/fix-dependencies.sh

# OR manually fix:
cd backend
source venv/bin/activate  # or venv/Scripts/activate on Windows
pip uninstall -y openai httpx
pip install -r requirements.txt
```

### Error: `OPENAI_API_KEY environment variable is required`

**Problem**: Missing or incorrect OpenAI API key.

**Solutions**:
1. Create `.env` file: `cp .env.example .env`
2. Edit `.env` and add your real API key:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
3. Get a key from: https://platform.openai.com/api-keys

### Error: `ModuleNotFoundError: No module named 'flask'`

**Problem**: Python dependencies not installed.

**Solution**:
```bash
cd backend
# Create virtual environment if it doesn't exist
python3 -m venv venv
source venv/bin/activate  # or venv/Scripts/activate on Windows
pip install -r requirements.txt
```

### Error: `Permission denied: '/tmp/audio_uploads'`

**Problem**: Backend can't create temporary directories.

**Solutions**:
```bash
# Create directory manually
sudo mkdir -p /tmp/audio_uploads
sudo chmod 755 /tmp/audio_uploads

# OR change upload directory in config.py
# Set UPLOAD_FOLDER to a writable location
```

## 🌐 Frontend Issues

### Error: Microphone not working

**Problem**: Browser microphone permissions or HTTPS requirements.

**Solutions**:
1. **Allow microphone access** when browser prompts
2. **Check browser permissions**: 
   - Chrome: Click lock icon → Microphone → Allow
   - Firefox: Click shield icon → Permissions
3. **Use HTTPS in production** (required for mic access)
4. **Try different browser** (Chrome/Firefox recommended)
5. **Test microphone** in other apps first

### Error: "Backend Unavailable" / Connection errors

**Problem**: Frontend can't reach backend API.

**Solutions**:
1. **Check backend is running**: Should see "Starting AI Room Temperature server on port 5000"
2. **Test backend directly**: Open http://localhost:5000/health
3. **Check API URL**: In browser dev console, verify frontend is calling correct URL
4. **CORS issues**: Make sure CORS_ORIGINS in .env includes your frontend URL
5. **Firewall**: Ensure ports 5000 and 8080 are accessible

### Error: Page refresh loses temperature data

**Problem**: localStorage disabled or browser privacy settings.

**Solutions**:
1. **Enable localStorage**: Check browser privacy settings
2. **Disable private/incognito mode**
3. **Check browser storage**: Dev tools → Application → Local Storage

## 🤖 AI/OpenAI Issues

### Error: `Rate limit exceeded`

**Problem**: Too many requests to OpenAI API.

**Solutions**:
1. **Increase recording interval**: Settings → Recording Interval → 30-60 seconds
2. **Check OpenAI usage**: Visit https://platform.openai.com/usage
3. **Upgrade OpenAI plan** if needed
4. **Add delays** between requests (modify frontend)

### Error: `Invalid API key`

**Problem**: Wrong or expired OpenAI API key.

**Solutions**:
1. **Verify key**: Test at https://platform.openai.com/api-keys
2. **Check key format**: Should start with `sk-`
3. **No spaces**: Ensure no extra spaces in .env file
4. **Create new key** if needed

### Error: `Model not found` or `Invalid model`

**Problem**: Using unsupported OpenAI model.

**Solution**:
Edit `backend/config.py`:
```python
WHISPER_MODEL = 'whisper-1'  # For transcription
GPT_MODEL = 'gpt-3.5-turbo'  # For analysis
```

## 🐳 Docker Issues

### Docker Container Issues

**Solutions**:
```bash
# Use direct Docker commands instead
docker build -t ai-room-temp .
docker run -d -p 8080:80 --env-file .env --name ai-room-temp ai-room-temp

# Check container status
docker ps
docker logs ai-room-temp
```

### Error: `bind: address already in use`

**Problem**: Ports 5000 or 8080 already in use.

**Solutions**:
```bash
# Find process using port
lsof -i :5000
lsof -i :8080

# Kill process
kill -9 <PID>

# OR change port in docker run command
# docker run -d -p 8081:80 --env-file .env --name ai-room-temp ai-room-temp
```

### Error: Docker build fails

**Solutions**:
1. **Check .env file exists**: `cp .env.example .env`
2. **Set OpenAI API key** in .env
3. **Clean build**: `docker stop ai-room-temp && docker rm ai-room-temp && docker build --no-cache -t ai-room-temp .`

## 🔧 Development Issues

### Error: JavaScript console errors

**Problem**: Frontend JavaScript issues.

**Solutions**:
1. **Open browser dev tools**: F12 → Console tab
2. **Check for errors** and note line numbers
3. **Hard refresh**: Ctrl+Shift+R (Cmd+Shift+R on Mac)
4. **Clear browser cache**

### Error: Audio processing takes too long

**Problem**: Large audio files or slow OpenAI responses.

**Solutions**:
1. **Reduce recording interval**: Settings → 10-20 seconds
2. **Check audio quality**: High sample rates increase processing time
3. **Check internet speed**: Slow uploads affect processing
4. **Monitor OpenAI status**: https://status.openai.com/

## 📱 Browser Compatibility

### Supported Browsers
- ✅ Chrome 66+
- ✅ Firefox 63+
- ✅ Safari 12+
- ✅ Edge 79+

### Unsupported Features
- ❌ Internet Explorer
- ❌ Very old mobile browsers
- ❌ Browsers without Web Audio API

## 🆘 Getting More Help

### Debug Mode
1. Open Settings panel
2. Enable "Debug mode"
3. Check debug information panel
4. Look for specific error details

### Logs and Diagnostics
```bash
# Backend logs
cd backend
source venv/bin/activate
python app.py  # Watch console output

# Check browser console
# F12 → Console tab → Look for red errors

# Test OpenAI connection
curl -H "Authorization: Bearer your-api-key" https://api.openai.com/v1/models
```

### Quick Fixes Checklist
- [ ] OpenAI API key is set correctly in .env
- [ ] Backend dependencies installed: `pip install -r requirements.txt`
- [ ] Backend is running on port 5000
- [ ] Frontend is accessible on port 8080
- [ ] Microphone permissions granted
- [ ] Using supported browser
- [ ] Internet connection working
- [ ] No firewall blocking ports

### Still Having Issues?
1. **Check the logs** in both backend terminal and browser console
2. **Run validation**: `./scripts/validate.sh`
3. **Try fresh setup**: Delete `venv` folder and run `./scripts/setup.sh`
4. **Test with minimal example**: Use 10-second intervals, simple conversation
5. **Check OpenAI status**: https://status.openai.com/

Remember: The most common issue is the OpenAI API key not being set correctly! 🔑