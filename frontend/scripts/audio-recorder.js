/**
 * AudioRecorder - Handles audio recording functionality
 */
class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.isRecording = false;
        this.recordingInterval = null;
        this.intervalDuration = 20000; // Default 20 seconds
        
        // Event callbacks
        this.onAudioReady = null;
        this.onRecordingStart = null;
        this.onRecordingStop = null;
        this.onError = null;
        
        // Audio constraints
        this.audioConstraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100
            },
            video: false
        };
        
        // Supported MIME types (in order of preference)
        this.supportedMimeTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/wav'
        ];
        
        this.selectedMimeType = this._getSupportedMimeType();
        
        // Browser compatibility check
        this._checkBrowserSupport();
    }
    
    /**
     * Check if the browser supports required features
     */
    _checkBrowserSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('getUserMedia is not supported in this browser');
        }
        
        if (!window.MediaRecorder) {
            throw new Error('MediaRecorder is not supported in this browser');
        }
    }
    
    /**
     * Find the best supported MIME type for recording
     */
    _getSupportedMimeType() {
        for (const mimeType of this.supportedMimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                console.log(`Using MIME type: ${mimeType}`);
                return mimeType;
            }
        }
        
        console.warn('No preferred MIME types supported, using default');
        return '';
    }
    
    /**
     * Request microphone permission and initialize recording
     */
    async initialize() {
        try {
            console.log('Requesting microphone access...');
            this.stream = await navigator.mediaDevices.getUserMedia(this.audioConstraints);
            
            // Create MediaRecorder instance
            const options = this.selectedMimeType ? { mimeType: this.selectedMimeType } : {};
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            
            // Set up event handlers
            this._setupMediaRecorderEvents();
            
            console.log('AudioRecorder initialized successfully');
            return true;
            
        } catch (error) {
            console.error('Failed to initialize AudioRecorder:', error);
            
            if (error.name === 'NotAllowedError') {
                throw new Error('Microphone access denied. Please allow microphone access to use this application.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No microphone found. Please connect a microphone and try again.');
            } else {
                throw new Error(`Microphone initialization failed: ${error.message}`);
            }
        }
    }
    
    /**
     * Set up MediaRecorder event handlers
     */
    _setupMediaRecorderEvents() {
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };
        
        this.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.audioChunks, { type: this.selectedMimeType });
            this.audioChunks = []; // Clear chunks for next recording
            
            if (this.onAudioReady) {
                this.onAudioReady(audioBlob);
            }
            
            if (this.onRecordingStop) {
                this.onRecordingStop();
            }
        };
        
        this.mediaRecorder.onstart = () => {
            console.log('MediaRecorder started');
            if (this.onRecordingStart) {
                this.onRecordingStart();
            }
        };
        
        this.mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event.error);
            if (this.onError) {
                this.onError(new Error(`Recording error: ${event.error}`));
            }
        };
    }
    
    /**
     * Start continuous recording with intervals
     */
    startRecording() {
        if (this.isRecording) {
            console.warn('Recording already in progress');
            return;
        }
        
        if (!this.mediaRecorder) {
            throw new Error('AudioRecorder not initialized. Call initialize() first.');
        }
        
        console.log(`Starting continuous recording with ${this.intervalDuration}ms intervals`);
        this.isRecording = true;
        
        // Start first recording immediately
        this._startRecordingChunk();
        
        // Set up interval for continuous recording
        this.recordingInterval = setInterval(() => {
            if (this.isRecording) {
                this._stopRecordingChunk();
                // Small delay before starting next chunk
                setTimeout(() => {
                    if (this.isRecording) {
                        this._startRecordingChunk();
                    }
                }, 100);
            }
        }, this.intervalDuration);
    }
    
    /**
     * Stop continuous recording
     */
    stopRecording() {
        if (!this.isRecording) {
            console.warn('No recording in progress');
            return;
        }
        
        console.log('Stopping continuous recording');
        this.isRecording = false;
        
        // Clear the interval
        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
        }
        
        // Stop current recording if active
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this._stopRecordingChunk();
        }
    }
    
    /**
     * Start recording a single chunk
     */
    _startRecordingChunk() {
        if (!this.mediaRecorder) return;
        
        try {
            if (this.mediaRecorder.state === 'inactive') {
                this.mediaRecorder.start();
                console.log('Started recording chunk');
            }
        } catch (error) {
            console.error('Error starting recording chunk:', error);
            if (this.onError) {
                this.onError(error);
            }
        }
    }
    
    /**
     * Stop recording a single chunk
     */
    _stopRecordingChunk() {
        if (!this.mediaRecorder) return;
        
        try {
            if (this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
                console.log('Stopped recording chunk');
            }
        } catch (error) {
            console.error('Error stopping recording chunk:', error);
            if (this.onError) {
                this.onError(error);
            }
        }
    }
    
    /**
     * Set the recording interval duration
     * @param {number} duration - Duration in milliseconds (10000-60000)
     */
    setIntervalDuration(duration) {
        const minDuration = 10000; // 10 seconds
        const maxDuration = 60000; // 60 seconds
        
        duration = Math.max(minDuration, Math.min(maxDuration, duration));
        this.intervalDuration = duration;
        
        console.log(`Recording interval set to ${duration}ms`);
        
        // If currently recording, restart with new interval
        if (this.isRecording) {
            this.stopRecording();
            // Small delay before restarting
            setTimeout(() => {
                this.startRecording();
            }, 200);
        }
    }
    
    /**
     * Get current recording state
     */
    getState() {
        return {
            isRecording: this.isRecording,
            intervalDuration: this.intervalDuration,
            mediaRecorderState: this.mediaRecorder ? this.mediaRecorder.state : 'uninitialized',
            mimeType: this.selectedMimeType,
            hasStream: !!this.stream
        };
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        console.log('Cleaning up AudioRecorder resources');
        
        this.stopRecording();
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.mediaRecorder = null;
        this.audioChunks = [];
        
        // Clear callbacks
        this.onAudioReady = null;
        this.onRecordingStart = null;
        this.onRecordingStop = null;
        this.onError = null;
    }
    
    /**
     * Get audio analysis information
     */
    getAudioInfo() {
        if (!this.stream) return null;
        
        const audioTrack = this.stream.getAudioTracks()[0];
        if (!audioTrack) return null;
        
        const settings = audioTrack.getSettings();
        return {
            sampleRate: settings.sampleRate,
            channelCount: settings.channelCount,
            echoCancellation: settings.echoCancellation,
            noiseSuppression: settings.noiseSuppression,
            autoGainControl: settings.autoGainControl,
            label: audioTrack.label
        };
    }
    
    /**
     * Test if microphone is working
     */
    async testMicrophone() {
        try {
            const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioTrack = testStream.getAudioTracks()[0];
            
            // Stop the test stream immediately
            testStream.getTracks().forEach(track => track.stop());
            
            return {
                success: true,
                deviceLabel: audioTrack.label,
                deviceId: audioTrack.getSettings().deviceId
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Get available audio input devices
     */
    async getAudioDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices
                .filter(device => device.kind === 'audioinput')
                .map(device => ({
                    deviceId: device.deviceId,
                    label: device.label || `Microphone ${device.deviceId.slice(0, 8)}...`
                }));
        } catch (error) {
            console.error('Error getting audio devices:', error);
            return [];
        }
    }
    
    /**
     * Switch to a different audio input device
     */
    async switchAudioDevice(deviceId) {
        if (this.isRecording) {
            throw new Error('Cannot switch devices while recording');
        }
        
        // Update constraints with new device
        this.audioConstraints.audio.deviceId = { exact: deviceId };
        
        // Reinitialize with new device
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        await this.initialize();
        return true;
    }
}