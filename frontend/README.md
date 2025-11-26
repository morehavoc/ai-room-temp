# Frontend Application

The frontend is a vanilla JavaScript web application that provides real-time conversation temperature monitoring with a visual thermometer interface.

## Features

- 🎙️ **Real-time Audio Recording**: Continuous microphone capture
- 🌡️ **Thermometer Visualization**: Animated SVG thermometer that responds to temperature changes
- ⚙️ **Configurable Settings**: Adjustable recording intervals (10-60 seconds)
- 📊 **Status Indicators**: Visual feedback for recording, processing, and error states
- 💾 **Persistent History**: Temperature data survives browser refresh
- 🔄 **Automatic Averaging**: Time-weighted averaging with 15-minute decay

## Getting Started

### Prerequisites
- Modern web browser with microphone support
- HTTPS connection (required for microphone access)
- Backend API server running

### Quick Start

1. **Serve the frontend files:**
   ```bash
   # Using Python's built-in server
   python -m http.server 8080
   
   # Or using Node.js serve
   npx serve . -p 8080
   
   # Or any other static file server
   ```

2. **Open in browser:**
   ```
   http://localhost:8080
   ```

3. **Grant permissions:**
   - Allow microphone access when prompted
   - Ensure backend server is running at `http://localhost:5001`

## Project Structure

```
frontend/
├── index.html              # Main application page
├── styles/
│   ├── main.css           # Main application styles
│   ├── thermometer.css    # Thermometer-specific styles
│   └── components.css     # UI component styles
├── scripts/
│   ├── app.js            # Main application logic
│   ├── audio-recorder.js  # Audio recording functionality
│   ├── temperature-manager.js # Temperature calculation and storage
│   ├── thermometer-display.js # Thermometer visualization
│   ├── settings-manager.js   # User settings management
│   └── status-indicator.js   # Status display and notifications
├── assets/
│   ├── icons/            # UI icons and graphics
│   └── sounds/           # Optional audio feedback
└── README.md
```

## Configuration

### Backend API Endpoint
The frontend is configured to connect to the backend at `http://localhost:5001` by default. To change this, modify the `API_BASE_URL` constant in `scripts/app.js`.

### Recording Settings
Users can configure:
- **Recording Interval**: 10-60 seconds
- **Temperature Sensitivity**: How much weight to give recent vs. older readings
- **Visual Settings**: Thermometer animation speed, color themes

## Usage

### Basic Operation
1. **Start Recording**: Click the "Start Monitoring" button
2. **View Temperature**: Watch the thermometer fill up as conversations get "hotter"
3. **Adjust Settings**: Use the settings panel to customize behavior
4. **Reset Data**: Clear temperature history with the reset button

### Status Indicators
- 🟢 **Green**: Recording and processing normally
- 🟡 **Yellow**: Processing audio or temporary issues
- 🔴 **Red**: Error state (check microphone permissions or backend connection)
- ⚪ **Gray**: Idle/not recording

### Thermometer Scale
- **Cool (Blue)**: 0-30 - Calm, peaceful conversation
- **Warm (Yellow)**: 31-60 - Normal to slightly animated discussion
- **Hot (Red)**: 61-100 - Heated debate, controversial topics, strong emotions

## Technical Details

### Audio Recording
- Uses Web Audio API for microphone access
- Records in configurable chunks (10-60 seconds)
- Converts to WAV format for transmission
- Handles browser compatibility gracefully

### Temperature Calculation
The frontend maintains a weighted average of temperature readings:

```javascript
// Time decay algorithm
const timeWeight = Math.max(0, 1 - (ageMinutes / 15));
const weightedTemperature = sum(temperature * timeWeight) / sum(timeWeights);
```

### Data Storage
- **LocalStorage**: Temperature history, user settings
- **SessionStorage**: Temporary recording state
- **No Cookies**: Privacy-first design

### API Communication
- **POST /analyze-audio**: Sends audio chunks for analysis
- **GET /health**: Checks backend connectivity
- **Error Handling**: Graceful degradation for network issues

## Browser Compatibility

### Supported Browsers
- Chrome 66+
- Firefox 63+
- Safari 12+
- Edge 79+

### Required Features
- Web Audio API
- MediaRecorder API
- Fetch API
- LocalStorage
- SVG support

### Fallbacks
- Graceful degradation for older browsers
- Audio format fallbacks (WebM → WAV)
- Visual fallbacks for SVG issues

## Deployment

### Development
```bash
# Simple local server
python -m http.server 8080

# With live reload
npx live-server --port=8080
```

### Production
The frontend consists of static files and can be deployed to:

- **CDN/Static Hosting**: Vercel, Netlify, GitHub Pages
- **Web Server**: Apache, Nginx
- **Cloud Storage**: AWS S3, Google Cloud Storage

### HTTPS Requirements
- Microphone access requires HTTPS in production
- Use SSL certificates or deploy to HTTPS-enabled platforms
- Local development works with HTTP on localhost

### Environment Configuration
Create a `config.js` file to override defaults:

```javascript
window.APP_CONFIG = {
    API_BASE_URL: 'https://your-backend-domain.com',
    RECORDING_INTERVAL_DEFAULT: 20,
    TEMPERATURE_DECAY_MINUTES: 15,
    DEBUG_MODE: false
};
```

## Troubleshooting

### Common Issues

**Microphone Not Working:**
- Check browser permissions
- Ensure HTTPS in production
- Test microphone in other applications

**No Temperature Updates:**
- Verify backend is running on port 5001
- Check browser console for errors
- Test backend endpoint directly at http://localhost:5001/health

**Page Refresh Loses Data:**
- Check if localStorage is enabled
- Verify browser privacy settings
- Look for console errors

**Thermometer Not Animating:**
- Check CSS animations are enabled
- Verify SVG support
- Look for JavaScript errors

### Debug Mode
Enable debug mode by adding `?debug=true` to the URL:
```
http://localhost:8080?debug=true
```

This shows additional information:
- Raw temperature values
- Recording status details
- API response data
- Performance metrics

## Customization

### Thermometer Appearance
Modify `styles/thermometer.css` to customize:
- Colors and gradients
- Size and proportions
- Animation timing
- Temperature ranges

### UI Layout
Edit `styles/main.css` and `styles/components.css` for:
- Overall layout
- Button styles
- Settings panel
- Status indicators

### Recording Behavior
Adjust `scripts/audio-recorder.js` for:
- Audio quality settings
- Chunk size optimization
- Error handling
- Browser compatibility

## Performance

### Optimization Tips
- Audio chunks are processed efficiently
- Temperature calculations use time-based caching
- DOM updates are throttled for smooth animations
- LocalStorage is used sparingly

### Memory Management
- Audio buffers are cleaned up after transmission
- Old temperature data is automatically pruned
- Event listeners are properly removed
- No memory leaks in long-running sessions

## Security

### Privacy Considerations
- No audio data persists in browser
- Temperature history stays local
- No tracking or analytics
- User consent required for microphone access

### Content Security Policy
Recommended CSP headers:
```
Content-Security-Policy: default-src 'self'; 
  connect-src 'self' http://localhost:5001; 
  media-src 'self' blob:;
  style-src 'self' 'unsafe-inline'
```