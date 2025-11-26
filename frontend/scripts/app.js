/**
 * Main Application - Coordinates all components and handles user interactions
 */
class RoomTemperatureApp {
    constructor() {
        // Configuration - use relative URLs when served from same container
        this.API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 
                           (window.location.hostname === 'localhost' ? 'http://localhost:5001' : '/api');
        
        // Component instances
        this.audioRecorder = null;
        this.temperatureManager = null;
        this.thermometerDisplay = null;
        this.temperatureGraph = null;
        this.settingsManager = null;
        this.statusIndicator = null;
        
        // DOM elements
        this.elements = {};
        
        // Application state
        this.isRecording = false;
        this.isProcessing = false;
        this.lastApiCall = null;
        
        // Debug mode
        this.debugMode = false;
        
        console.log('RoomTemperatureApp initializing...');
    }
    
    /**
     * Initialize the application
     */
    async initialize() {
        try {
            // Get DOM elements
            this._initializeElements();
            
            // Initialize components
            await this._initializeComponents();
            
            // Setup event listeners
            this._setupEventListeners();
            
            // Test backend connection
            await this._testBackendConnection();
            
            // Initial UI update
            this._updateUI();
            
            console.log('RoomTemperatureApp initialized successfully');
            this.statusIndicator.showSuccess('Application Ready', 'Click "Start Monitoring" to begin');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.statusIndicator.showError('Initialization Failed', error.message);
            throw error;
        }
    }
    
    /**
     * Get DOM element references
     */
    _initializeElements() {
        this.elements = {
            startStopBtn: document.getElementById('start-stop-btn'),
            resetBtn: document.getElementById('reset-btn'),
            thermometerSvg: document.getElementById('thermometer-svg'),
            temperatureGraph: document.getElementById('temperature-graph'),
            currentTemperature: document.getElementById('current-temperature'),
            averageTemperature: document.getElementById('average-temperature')
        };
        
        // Validate critical elements
        const required = ['startStopBtn', 'resetBtn', 'thermometerSvg', 'temperatureGraph'];
        for (const key of required) {
            if (!this.elements[key]) {
                throw new Error(`Required element not found: ${key}`);
            }
        }
        
        console.log('DOM elements initialized');
    }
    
    /**
     * Initialize all component instances
     */
    async _initializeComponents() {
        // Status indicator first (for error reporting)
        this.statusIndicator = new StatusIndicator();
        
        // Settings manager
        this.settingsManager = new SettingsManager();
        this.settingsManager.initialize();
        
        // Update API URL from settings
        this.API_BASE_URL = this.settingsManager.getSetting('apiBaseUrl');
        
        // Temperature manager
        this.temperatureManager = new TemperatureManager();
        
        // Thermometer display
        this.thermometerDisplay = new ThermometerDisplay(this.elements.thermometerSvg);
        
        // Temperature graph
        this.temperatureGraph = new TemperatureGraph(this.elements.temperatureGraph);
        
        // Audio recorder (requires user permission)
        this.audioRecorder = new AudioRecorder();
        
        // Setup component callbacks
        this._setupComponentCallbacks();
        
        console.log('Components initialized');
    }
    
    /**
     * Setup callbacks between components
     */
    _setupComponentCallbacks() {
        // Audio recorder callbacks
        this.audioRecorder.onAudioReady = (audioBlob) => this._processAudioBlob(audioBlob);
        this.audioRecorder.onRecordingStart = () => this._onRecordingStart();
        this.audioRecorder.onRecordingStop = () => this._onRecordingStop();
        this.audioRecorder.onError = (error) => this._onRecordingError(error);
        
        // Temperature manager callbacks
        this.temperatureManager.onTemperatureUpdate = (data) => this._onTemperatureUpdate(data);
        
        // Settings manager callbacks
        this.settingsManager.onSettingsChange = (key, value) => this._onSettingsChange(key, value);
    }
    
    /**
     * Setup DOM event listeners
     */
    _setupEventListeners() {
        // Start/Stop button
        this.elements.startStopBtn.addEventListener('click', () => {
            this._toggleRecording();
        });
        
        // Reset button
        this.elements.resetBtn.addEventListener('click', () => {
            this._resetApplication();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this._handleKeyboard(e);
        });
        
        // Window events
        window.addEventListener('beforeunload', () => {
            this._cleanup();
        });
        
        // Visibility change (pause/resume)
        document.addEventListener('visibilitychange', () => {
            this._handleVisibilityChange();
        });
        
        console.log('Event listeners setup complete');
    }
    
    /**
     * Test backend connection
     */
    async _testBackendConnection() {
        const isConnected = await this.statusIndicator.testConnection(this.API_BASE_URL);
        
        if (!isConnected) {
            this.statusIndicator.showWarning(
                'Backend Offline', 
                'The AI analysis server is not responding. Temperature analysis will not work until connection is restored.',
                0 // Don't auto-dismiss
            );
        }
        
        return isConnected;
    }
    
    /**
     * Toggle recording on/off
     */
    async _toggleRecording() {
        if (this.isRecording) {
            await this._stopRecording();
        } else {
            await this._startRecording();
        }
    }
    
    /**
     * Start recording
     */
    async _startRecording() {
        try {
            this.statusIndicator.setStatus('ready', 'Initializing microphone...');
            
            // Initialize audio recorder if needed
            if (!this.audioRecorder.stream) {
                await this.audioRecorder.initialize();
                this.statusIndicator.showSuccess('Microphone Ready', 'Microphone access granted');
            }
            
            // Set recording interval from settings
            const intervalSeconds = this.settingsManager.getSetting('recordingInterval');
            this.audioRecorder.setIntervalDuration(intervalSeconds * 1000);
            
            // Start recording
            this.audioRecorder.startRecording();
            this.isRecording = true;
            
            // Update UI
            this._updateRecordingUI(true);
            
            // Start thermometer effect
            this.thermometerDisplay.startRecordingEffect();
            
            this.statusIndicator.showRecordingStatus('start');
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.statusIndicator.showRecordingStatus('error', error.message);
        }
    }
    
    /**
     * Stop recording
     */
    async _stopRecording() {
        try {
            this.audioRecorder.stopRecording();
            this.isRecording = false;
            
            // Update UI
            this._updateRecordingUI(false);
            
            // Stop thermometer effect
            this.thermometerDisplay.stopRecordingEffect();
            
            this.statusIndicator.showRecordingStatus('stop');
            
        } catch (error) {
            console.error('Failed to stop recording:', error);
            this.statusIndicator.showError('Stop Recording Failed', error.message);
        }
    }
    
    /**
     * Process audio blob by sending to backend
     */
    async _processAudioBlob(audioBlob) {
        if (this.isProcessing) {
            console.log('Already processing audio, skipping...');
            return;
        }
        
        this.isProcessing = true;
        this.statusIndicator.setStatus('processing', 'Analyzing conversation...');
        this.thermometerDisplay.showProcessingEffect();
        
        try {
            // Check if audio blob is valid
            if (!audioBlob || audioBlob.size === 0) {
                throw new Error('Audio recording is empty');
            }
            
            if (audioBlob.size < 1000) { // Less than 1KB
                console.warn(`Audio file very small (${audioBlob.size} bytes), may not contain meaningful audio`);
            }
            
            const formData = new FormData();
            // Create filename based on the blob type
            const mimeType = audioBlob.type || 'audio/webm';
            const extension = mimeType.includes('webm') ? 'webm' : 
                             mimeType.includes('mp4') ? 'mp4' : 
                             mimeType.includes('wav') ? 'wav' : 'webm';
            const filename = `audio-${Date.now()}.${extension}`;
            
            formData.append('audio', audioBlob, filename);
            
            console.log(`Sending audio file: ${filename}, type: ${mimeType}, size: ${audioBlob.size} bytes`);
            
            const response = await fetch(`${this.API_BASE_URL}/analyze-audio`, {
                method: 'POST',
                body: formData
            });
            
            this.lastApiCall = new Date().toLocaleTimeString();
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Add temperature reading
            this.temperatureManager.addReading(
                result.temperature,
                result.confidence,
                'api'
            );
            
            // Show different messages based on the analysis
            if (result.temperature >= 70) {
                this.statusIndicator.showTemperatureUpdate(result.temperature, result.confidence);
            } else if (result.confidence < 0.4) {
                // Low confidence - likely silence or minimal audio
                if (result.analysis_summary && result.analysis_summary.includes('silence')) {
                    console.log('Silence detected - no conversation activity');
                    this.statusIndicator.showSilenceDetected();
                } else if (result.analysis_summary && (result.analysis_summary.includes('Minimal speech') || result.analysis_summary.includes('filler words'))) {
                    console.log('Minimal speech detected - possibly background noise or short sounds');
                    this.statusIndicator.showMinimalActivity(result.analysis_summary);
                } else {
                    console.log(`Low confidence reading: ${result.temperature}° (${result.analysis_summary})`);
                }
            }
            
            console.log(`Temperature analysis complete: ${result.temperature}° (confidence: ${result.confidence})`);
            
            // Log analysis summary for debugging
            if (result.analysis_summary) {
                console.log(`Analysis: ${result.analysis_summary}`);
            }
            
        } catch (error) {
            console.error('Audio processing failed:', error);
            this.statusIndicator.showApiError(error, 'Audio analysis');
            
            // Add a low-confidence neutral reading to keep the app responsive
            this.temperatureManager.addReading(30, 0.1, 'error');
            
        } finally {
            this.isProcessing = false;
            if (this.isRecording) {
                this.statusIndicator.setStatus('recording', 'Recording audio...');
            } else {
                this.statusIndicator.setStatus('ready', 'Ready to record');
            }
            
            // Update debug info
            this._updateDebugInfo();
        }
    }
    
    /**
     * Reset application state
     */
    _resetApplication() {
        // Confirm if recording
        if (this.isRecording) {
            if (!confirm('Stop recording and reset all temperature data?')) {
                return;
            }
            this._stopRecording();
        } else if (!confirm('Reset all temperature data?')) {
            return;
        }
        
        // Reset temperature data
        this.temperatureManager.reset();
        
        // Reset thermometer display
        this.thermometerDisplay.reset();
        
        // Reset temperature graph
        if (this.temperatureGraph) {
            this.temperatureGraph.reset();
        }
        
        // Reset UI
        this._updateUI();
        
        this.statusIndicator.showInfo('Data Reset', 'All temperature data has been cleared');
        
        console.log('Application state reset');
    }
    
    /**
     * Handle recording start
     */
    _onRecordingStart() {
        console.log('Recording started');
        this._updateDebugInfo();
    }
    
    /**
     * Handle recording stop
     */
    _onRecordingStop() {
        console.log('Recording stopped');
        this._updateDebugInfo();
    }
    
    /**
     * Handle recording error
     */
    _onRecordingError(error) {
        console.error('Recording error:', error);
        this.isRecording = false;
        this._updateRecordingUI(false);
        this.thermometerDisplay.stopRecordingEffect();
        this.statusIndicator.showRecordingStatus('error', error.message);
    }
    
    /**
     * Handle temperature updates
     */
    _onTemperatureUpdate(data) {
        // Update thermometer display
        this.thermometerDisplay.updateTemperature(data.average, true);
        
        // Update temperature graph with current temperature (only for meaningful values)
        if (this.temperatureGraph && data.current !== null && data.current !== undefined && data.current > 0) {
            this.temperatureGraph.addDataPoint(data.current);
        }
        
        // Update temperature displays
        if (this.elements.currentTemperature) {
            this.elements.currentTemperature.textContent = data.current || '--';
        }
        
        if (this.elements.averageTemperature) {
            this.elements.averageTemperature.textContent = data.average || '--';
        }
        
        // Show trend effect
        const trend = this.temperatureManager.getTrend();
        if (trend.confidence > 0.3) {
            this.thermometerDisplay.addTrendEffect(trend.direction);
        }
        
        console.log(`Temperature display updated: current=${data.current}°, average=${data.average}°`);
        
        // Update debug info
        this._updateDebugInfo();
    }
    
    /**
     * Handle settings changes
     */
    _onSettingsChange(key, value, oldValue) {
        console.log(`Setting changed: ${key} = ${value} (was: ${oldValue})`);
        
        switch (key) {
            case 'recordingInterval':
                if (this.audioRecorder) {
                    this.audioRecorder.setIntervalDuration(value * 1000);
                }
                break;
                
            case 'temperatureSensitivity':
                this.temperatureManager.setSensitivity(value);
                break;
                
            case 'debugMode':
                this.debugMode = value;
                this._updateDebugInfo();
                break;
                
            case 'apiBaseUrl':
                this.API_BASE_URL = value;
                this._testBackendConnection();
                break;
        }
    }
    
    /**
     * Handle keyboard shortcuts
     */
    _handleKeyboard(event) {
        // Don't interfere with input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (event.key) {
            case ' ': // Spacebar
            case 'Enter':
                event.preventDefault();
                this._toggleRecording();
                break;
                
            case 'r':
            case 'R':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this._resetApplication();
                }
                break;
                
            case 's':
            case 'S':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.settingsManager.toggleSettingsPanel();
                }
                break;
        }
    }
    
    /**
     * Handle visibility change (tab focus/blur)
     */
    _handleVisibilityChange() {
        if (document.hidden) {
            console.log('App hidden, pausing non-critical operations');
        } else {
            console.log('App visible, resuming operations');
            this._updateDebugInfo();
        }
    }
    
    /**
     * Update recording UI state
     */
    _updateRecordingUI(isRecording) {
        const button = this.elements.startStopBtn;
        const buttonText = button.querySelector('.button-text');
        const buttonIcon = button.querySelector('.button-icon');
        
        if (isRecording) {
            button.classList.add('recording');
            buttonText.textContent = 'Stop Monitoring';
            buttonIcon.textContent = '⏹️';
        } else {
            button.classList.remove('recording');
            buttonText.textContent = 'Start Monitoring';
            buttonIcon.textContent = '🎙️';
        }
        
        // Disable reset button while recording
        this.elements.resetBtn.disabled = isRecording;
    }
    
    /**
     * Update overall UI state
     */
    _updateUI() {
        // Update temperature displays
        const tempData = this.temperatureManager.getCurrentData();
        this._onTemperatureUpdate(tempData);
        
        // Update recording UI
        this._updateRecordingUI(this.isRecording);
        
        // Update debug info
        this._updateDebugInfo();
    }
    
    /**
     * Update debug information
     */
    _updateDebugInfo() {
        if (!this.debugMode) return;
        
        const audioState = this.audioRecorder ? this.audioRecorder.getState() : null;
        const tempData = this.temperatureManager ? this.temperatureManager.getCurrentData() : null;
        
        const debugInfo = {
            recordingState: audioState ? 
                `${audioState.isRecording ? 'Recording' : 'Idle'} (${audioState.intervalDuration/1000}s)` : 
                'Not initialized',
            lastApiCall: this.lastApiCall || 'None',
            temperatureReadings: tempData ? tempData.readingCount : 0,
            audioBufferSize: '0 MB' // Could calculate actual size
        };
        
        this.statusIndicator.updateDebugInfo(debugInfo);
    }
    
    /**
     * Export application data
     */
    exportData() {
        const data = {
            temperature: this.temperatureManager.exportData(),
            settings: this.settingsManager.exportSettings(),
            timestamp: Date.now(),
            version: '1.0'
        };
        
        return JSON.stringify(data, null, 2);
    }
    
    /**
     * Import application data
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            let success = true;
            
            if (data.temperature) {
                success = this.temperatureManager.importData(data.temperature) && success;
            }
            
            if (data.settings) {
                success = this.settingsManager.importSettings(data.settings) && success;
            }
            
            if (success) {
                this.statusIndicator.showSuccess('Data Imported', 'Application data restored successfully');
                this._updateUI();
            } else {
                this.statusIndicator.showWarning('Import Warning', 'Some data could not be imported');
            }
            
            return success;
            
        } catch (error) {
            this.statusIndicator.showError('Import Failed', 'Invalid data format');
            return false;
        }
    }
    
    /**
     * Get application status
     */
    getStatus() {
        return {
            isRecording: this.isRecording,
            isProcessing: this.isProcessing,
            temperature: this.temperatureManager ? this.temperatureManager.getCurrentData() : null,
            audio: this.audioRecorder ? this.audioRecorder.getState() : null,
            settings: this.settingsManager ? this.settingsManager.getAllSettings() : null
        };
    }
    
    /**
     * Cleanup resources
     */
    _cleanup() {
        console.log('Cleaning up application resources...');
        
        if (this.isRecording) {
            this.audioRecorder.stopRecording();
        }
        
        if (this.audioRecorder) {
            this.audioRecorder.cleanup();
        }
        
        if (this.statusIndicator) {
            this.statusIndicator.destroy();
        }
        
        if (this.settingsManager) {
            this.settingsManager.destroy();
        }
        
        if (this.thermometerDisplay) {
            this.thermometerDisplay.destroy();
        }
    }
    
    /**
     * Destroy application
     */
    destroy() {
        this._cleanup();
        console.log('RoomTemperatureApp destroyed');
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing application...');
    
    try {
        // Create global app instance
        window.roomTempApp = new RoomTemperatureApp();
        await window.roomTempApp.initialize();
        
        // Expose for debugging
        if (window.roomTempApp.debugMode) {
            console.log('Debug mode: App instance available as window.roomTempApp');
        }
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        
        // Show basic error message if status indicator failed to initialize
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; 
            background: #ef4444; color: white; 
            padding: 1rem; border-radius: 0.5rem; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000; max-width: 300px;
        `;
        errorDiv.innerHTML = `
            <strong>Initialization Failed</strong><br>
            ${error.message}
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 10000);
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.roomTempApp) {
        window.roomTempApp.destroy();
    }
});