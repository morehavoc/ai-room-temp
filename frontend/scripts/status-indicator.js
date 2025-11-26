/**
 * StatusIndicator - Handles status display and toast notifications
 */
class StatusIndicator {
    constructor() {
        // DOM elements
        this.statusIndicator = document.getElementById('status-indicator');
        this.statusLight = this.statusIndicator?.querySelector('.status-light');
        this.statusText = this.statusIndicator?.querySelector('.status-text');
        this.connectionStatus = document.getElementById('connection-status');
        this.connectionText = this.connectionStatus?.querySelector('.connection-text');
        this.toastContainer = document.getElementById('toast-container');
        
        // Current state
        this.currentStatus = 'idle';
        this.connectionState = 'unknown';
        
        // Toast queue
        this.toastQueue = [];
        this.activeToasts = new Map();
        
        // Status configurations
        this.statusConfig = {
            idle: {
                text: 'Ready to start',
                class: 'idle',
                color: '#94a3b8'
            },
            ready: {
                text: 'Ready to record',
                class: 'ready',
                color: '#06b6d4'
            },
            recording: {
                text: 'Recording audio...',
                class: 'recording',
                color: '#10b981'
            },
            processing: {
                text: 'Analyzing...',
                class: 'processing',
                color: '#f59e0b'
            },
            error: {
                text: 'Error occurred',
                class: 'error',
                color: '#ef4444'
            }
        };
        
        this._initialize();
        console.log('StatusIndicator initialized');
    }
    
    /**
     * Initialize the status indicator
     */
    _initialize() {
        if (!this.toastContainer) {
            console.warn('Toast container not found, creating one');
            this._createToastContainer();
        }
        
        this.setStatus('idle');
        this.setConnectionStatus('checking');
    }
    
    /**
     * Create toast container if it doesn't exist
     */
    _createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.id = 'toast-container';
        this.toastContainer.className = 'toast-container';
        document.body.appendChild(this.toastContainer);
    }
    
    /**
     * Set the main status
     * @param {string} status - Status key (idle, ready, recording, processing, error)
     * @param {string} customText - Optional custom text override
     */
    setStatus(status, customText = null) {
        const config = this.statusConfig[status];
        if (!config) {
            console.warn(`Unknown status: ${status}`);
            return;
        }
        
        this.currentStatus = status;
        
        // Update status light
        if (this.statusLight) {
            // Remove all status classes
            Object.keys(this.statusConfig).forEach(key => {
                this.statusLight.classList.remove(key);
            });
            this.statusLight.classList.add(config.class);
        }
        
        // Update status text
        if (this.statusText) {
            this.statusText.textContent = customText || config.text;
        }
        
        // Update parent container class
        if (this.statusIndicator) {
            // Remove all status classes
            Object.keys(this.statusConfig).forEach(key => {
                this.statusIndicator.classList.remove(key);
            });
            this.statusIndicator.classList.add(config.class);
        }
        
        console.log(`Status updated to: ${status}`);
    }
    
    /**
     * Set connection status
     * @param {string} state - Connection state (connected, disconnected, checking)
     * @param {string} customText - Optional custom text
     */
    setConnectionStatus(state, customText = null) {
        this.connectionState = state;
        
        if (this.connectionStatus) {
            // Remove existing classes
            this.connectionStatus.classList.remove('connected', 'disconnected', 'checking');
            this.connectionStatus.classList.add(state);
        }
        
        if (this.connectionText) {
            const defaultText = {
                connected: 'Backend connected',
                disconnected: 'Backend disconnected',
                checking: 'Checking backend...'
            };
            
            this.connectionText.textContent = customText || defaultText[state] || 'Unknown';
        }
        
        console.log(`Connection status: ${state}`);
    }
    
    /**
     * Show a toast notification
     * @param {string} type - Toast type (success, warning, error, info)
     * @param {string} title - Toast title
     * @param {string} message - Toast message
     * @param {number} duration - Auto-dismiss duration (0 = no auto-dismiss)
     */
    showToast(type, title, message = '', duration = 5000) {
        const toast = this._createToast(type, title, message, duration);
        
        if (this.toastContainer) {
            this.toastContainer.appendChild(toast.element);
            
            // Animate in
            requestAnimationFrame(() => {
                toast.element.style.opacity = '1';
                toast.element.style.transform = 'translateX(0)';
            });
            
            // Store reference
            this.activeToasts.set(toast.id, toast);
            
            // Auto-dismiss
            if (duration > 0) {
                toast.timeout = setTimeout(() => {
                    this.dismissToast(toast.id);
                }, duration);
            }
        }
        
        console.log(`Toast shown: ${type} - ${title}`);
        return toast.id;
    }
    
    /**
     * Create a toast element
     */
    _createToast(type, title, message, duration) {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('data-toast-id', id);
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        
        // Icon mapping
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close" aria-label="Close notification">✕</button>
        `;
        
        // Add close button functionality
        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => {
            this.dismissToast(id);
        });
        
        return {
            id,
            element: toast,
            type,
            title,
            message,
            duration,
            timeout: null
        };
    }
    
    /**
     * Dismiss a toast notification
     * @param {string} toastId - Toast ID to dismiss
     */
    dismissToast(toastId) {
        const toast = this.activeToasts.get(toastId);
        if (!toast) return;
        
        // Clear timeout
        if (toast.timeout) {
            clearTimeout(toast.timeout);
        }
        
        // Animate out
        toast.element.style.opacity = '0';
        toast.element.style.transform = 'translateX(100%)';
        
        // Remove after animation
        setTimeout(() => {
            if (toast.element.parentNode) {
                toast.element.parentNode.removeChild(toast.element);
            }
            this.activeToasts.delete(toastId);
        }, 300);
    }
    
    /**
     * Dismiss all toast notifications
     */
    dismissAllToasts() {
        const toastIds = Array.from(this.activeToasts.keys());
        toastIds.forEach(id => this.dismissToast(id));
    }
    
    /**
     * Show success message
     */
    showSuccess(title, message = '', duration = 5000) {
        return this.showToast('success', title, message, duration);
    }
    
    /**
     * Show warning message
     */
    showWarning(title, message = '', duration = 7000) {
        return this.showToast('warning', title, message, duration);
    }
    
    /**
     * Show error message
     */
    showError(title, message = '', duration = 10000) {
        return this.showToast('error', title, message, duration);
    }
    
    /**
     * Show info message
     */
    showInfo(title, message = '', duration = 5000) {
        return this.showToast('info', title, message, duration);
    }
    
    /**
     * Show API error with details
     */
    showApiError(error, context = 'API request') {
        let title = 'Connection Error';
        let message = 'Unable to connect to the backend server';
        
        if (error.message) {
            if (error.message.includes('fetch')) {
                title = 'Network Error';
                message = 'Check your internet connection and backend server status';
            } else if (error.message.includes('timeout')) {
                title = 'Request Timeout';
                message = 'The server is taking too long to respond';
            } else if (error.message.includes('404')) {
                title = 'Endpoint Not Found';
                message = 'The backend API endpoint is not available';
            } else {
                message = error.message;
            }
        }
        
        return this.showError(title, `${context}: ${message}`, 10000);
    }
    
    /**
     * Show recording status updates
     */
    showRecordingStatus(action, details = '') {
        switch (action) {
            case 'start':
                this.setStatus('recording', 'Recording started');
                this.showSuccess('Recording Started', 'Now monitoring conversation temperature');
                break;
            case 'stop':
                this.setStatus('ready', 'Recording stopped');
                this.showInfo('Recording Stopped', 'Temperature monitoring paused');
                break;
            case 'error':
                this.setStatus('error', 'Recording error');
                this.showError('Recording Error', details || 'Failed to access microphone');
                break;
            case 'processing':
                this.setStatus('processing', 'Processing audio');
                break;
        }
    }
    
    /**
     * Show temperature update status
     */
    showTemperatureUpdate(temperature, confidence) {
        const tempLevel = temperature >= 80 ? 'hot' : temperature >= 60 ? 'warm' : temperature >= 40 ? 'cool' : 'cold';
        const emoji = { hot: '🔥', warm: '🌡️', cool: '😐', cold: '❄️' }[tempLevel];
        
        if (temperature >= 85) {
            this.showWarning(
                `Temperature High! ${emoji}`,
                `Conversation heat detected: ${temperature}° (confidence: ${Math.round(confidence * 100)}%)`,
                3000
            );
        }
    }
    
    /**
     * Show silence/low activity indicator
     */
    showSilenceDetected() {
        this.showInfo(
            '🤫 Quiet Period',
            'No conversation detected - monitoring for activity...',
            2000
        );
    }
    
    /**
     * Show minimal activity indicator
     */
    showMinimalActivity(summary) {
        this.showInfo(
            '🔇 Low Activity', 
            summary || 'Minimal conversation detected',
            2000
        );
    }
    
    /**
     * Update debug information
     */
    updateDebugInfo(info) {
        const debugElements = {
            'debug-recording-state': info.recordingState || 'Unknown',
            'debug-last-api': info.lastApiCall || 'None',
            'debug-temp-history': info.temperatureReadings ? `${info.temperatureReadings} readings` : '0 readings',
            'debug-audio-buffer': info.audioBufferSize || '0 MB'
        };
        
        Object.entries(debugElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    /**
     * Show connection test result
     */
    async testConnection(apiBaseUrl) {
        this.setConnectionStatus('checking', 'Testing connection...');
        
        try {
            const response = await fetch(`${apiBaseUrl}/health`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                this.setConnectionStatus('connected');
                this.showSuccess('Backend Connected', 'API server is responding normally');
                return true;
            } else {
                throw new Error(`Server responded with status ${response.status}`);
            }
            
        } catch (error) {
            this.setConnectionStatus('disconnected', 'Connection failed');
            this.showError('Backend Unavailable', `Cannot connect to ${apiBaseUrl}`);
            return false;
        }
    }
    
    /**
     * Show progress indicator
     */
    showProgress(message, showSpinner = true) {
        const progressToast = document.createElement('div');
        progressToast.className = 'toast info progress-toast';
        progressToast.innerHTML = `
            <div class="toast-icon">${showSpinner ? '<div class="spinner small"></div>' : 'ℹ️'}</div>
            <div class="toast-content">
                <div class="toast-title">${message}</div>
            </div>
        `;
        
        if (this.toastContainer) {
            this.toastContainer.appendChild(progressToast);
        }
        
        return {
            update: (newMessage) => {
                const titleElement = progressToast.querySelector('.toast-title');
                if (titleElement) titleElement.textContent = newMessage;
            },
            dismiss: () => {
                if (progressToast.parentNode) {
                    progressToast.parentNode.removeChild(progressToast);
                }
            }
        };
    }
    
    /**
     * Get current status
     */
    getStatus() {
        return {
            status: this.currentStatus,
            connection: this.connectionState,
            activeToasts: this.activeToasts.size
        };
    }
    
    /**
     * Clean up and destroy
     */
    destroy() {
        // Dismiss all toasts
        this.dismissAllToasts();
        
        // Clear any remaining timeouts
        this.activeToasts.forEach(toast => {
            if (toast.timeout) {
                clearTimeout(toast.timeout);
            }
        });
        
        this.activeToasts.clear();
        
        console.log('StatusIndicator destroyed');
    }
}