/**
 * SettingsManager - Handles user settings and preferences
 */
class SettingsManager {
    constructor() {
        this.settings = {
            recordingInterval: 20, // seconds
            temperatureSensitivity: 5, // 1-10 scale
            audioFeedback: false,
            debugMode: false,
            apiBaseUrl: window.location.hostname === 'localhost' ? 'http://localhost:5001' : '/api',
            decayWindowMinutes: 15,
            autoStart: false,
            theme: 'default'
        };
        
        this.storageKey = 'app_settings';
        
        // Event callbacks
        this.onSettingsChange = null;
        
        // DOM elements (will be set when initialized)
        this.elements = {};
        
        // Load saved settings
        this._loadSettings();
        
        console.log('SettingsManager initialized');
    }
    
    /**
     * Initialize DOM elements and event listeners
     */
    initialize() {
        this.elements = {
            recordingInterval: document.getElementById('recording-interval'),
            intervalDisplay: document.getElementById('interval-display'),
            temperatureSensitivity: document.getElementById('temperature-sensitivity'),
            sensitivityDisplay: document.getElementById('sensitivity-display'),
            audioFeedback: document.getElementById('audio-feedback'),
            debugMode: document.getElementById('debug-mode'),
            settingsPanel: document.getElementById('settings-panel'),
            settingsBtn: document.getElementById('settings-btn'),
            debugPanel: document.getElementById('debug-panel')
        };
        
        this._setupEventListeners();
        this._updateUI();
        
        console.log('SettingsManager DOM initialized');
    }
    
    /**
     * Setup event listeners for settings controls
     */
    _setupEventListeners() {
        // Recording interval slider
        if (this.elements.recordingInterval) {
            this.elements.recordingInterval.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.updateSetting('recordingInterval', value);
                this._updateIntervalDisplay(value);
            });
        }
        
        // Temperature sensitivity slider
        if (this.elements.temperatureSensitivity) {
            this.elements.temperatureSensitivity.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.updateSetting('temperatureSensitivity', value);
                this._updateSensitivityDisplay(value);
            });
        }
        
        // Audio feedback checkbox
        if (this.elements.audioFeedback) {
            this.elements.audioFeedback.addEventListener('change', (e) => {
                this.updateSetting('audioFeedback', e.target.checked);
            });
        }
        
        // Debug mode checkbox
        if (this.elements.debugMode) {
            this.elements.debugMode.addEventListener('change', (e) => {
                this.updateSetting('debugMode', e.target.checked);
                this._toggleDebugPanel(e.target.checked);
            });
        }
        
        // Settings panel toggle
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => {
                this.toggleSettingsPanel();
            });
        }
        
        // Check for URL parameters that might override settings
        this._checkUrlParameters();
    }
    
    /**
     * Update a single setting
     */
    updateSetting(key, value) {
        const oldValue = this.settings[key];
        this.settings[key] = value;
        
        console.log(`Setting updated: ${key} = ${value} (was: ${oldValue})`);
        
        this._saveSettings();
        
        // Notify listeners
        if (this.onSettingsChange) {
            this.onSettingsChange(key, value, oldValue);
        }
        
        // Handle special settings
        this._handleSpecialSetting(key, value);
    }
    
    /**
     * Get a setting value
     */
    getSetting(key) {
        return this.settings[key];
    }
    
    /**
     * Get all settings
     */
    getAllSettings() {
        return { ...this.settings };
    }
    
    /**
     * Reset settings to defaults
     */
    resetToDefaults() {
        console.log('Resetting settings to defaults');
        
        const defaults = {
            recordingInterval: 20,
            temperatureSensitivity: 5,
            audioFeedback: false,
            debugMode: false,
            apiBaseUrl: window.location.hostname === 'localhost' ? 'http://localhost:5001' : '/api',
            decayWindowMinutes: 15,
            autoStart: false,
            theme: 'default'
        };
        
        this.settings = { ...defaults };
        this._saveSettings();
        this._updateUI();
        
        // Notify listeners
        if (this.onSettingsChange) {
            this.onSettingsChange('reset', this.settings, {});
        }
    }
    
    /**
     * Toggle settings panel visibility
     */
    toggleSettingsPanel() {
        if (this.elements.settingsPanel) {
            const isHidden = this.elements.settingsPanel.classList.contains('hidden');
            
            if (isHidden) {
                this.elements.settingsPanel.classList.remove('hidden');
                this.elements.settingsBtn.classList.add('active');
            } else {
                this.elements.settingsPanel.classList.add('hidden');
                this.elements.settingsBtn.classList.remove('active');
            }
            
            console.log(`Settings panel ${isHidden ? 'opened' : 'closed'}`);
        }
    }
    
    /**
     * Update UI elements to reflect current settings
     */
    _updateUI() {
        // Recording interval
        if (this.elements.recordingInterval) {
            this.elements.recordingInterval.value = this.settings.recordingInterval;
            this._updateIntervalDisplay(this.settings.recordingInterval);
        }
        
        // Temperature sensitivity
        if (this.elements.temperatureSensitivity) {
            this.elements.temperatureSensitivity.value = this.settings.temperatureSensitivity;
            this._updateSensitivityDisplay(this.settings.temperatureSensitivity);
        }
        
        // Checkboxes
        if (this.elements.audioFeedback) {
            this.elements.audioFeedback.checked = this.settings.audioFeedback;
        }
        
        if (this.elements.debugMode) {
            this.elements.debugMode.checked = this.settings.debugMode;
            this._toggleDebugPanel(this.settings.debugMode);
        }
    }
    
    /**
     * Update recording interval display
     */
    _updateIntervalDisplay(value) {
        if (this.elements.intervalDisplay) {
            this.elements.intervalDisplay.textContent = `${value} seconds`;
        }
    }
    
    /**
     * Update sensitivity display
     */
    _updateSensitivityDisplay(value) {
        if (this.elements.sensitivityDisplay) {
            const labels = {
                1: 'Very Low', 2: 'Low', 3: 'Low', 
                4: 'Medium', 5: 'Normal', 6: 'Medium',
                7: 'High', 8: 'High', 9: 'Very High', 10: 'Maximum'
            };
            this.elements.sensitivityDisplay.textContent = labels[value] || 'Normal';
        }
    }
    
    /**
     * Toggle debug panel visibility
     */
    _toggleDebugPanel(show) {
        if (this.elements.debugPanel) {
            if (show) {
                this.elements.debugPanel.classList.remove('hidden');
            } else {
                this.elements.debugPanel.classList.add('hidden');
            }
        }
    }
    
    /**
     * Handle special settings that need immediate action
     */
    _handleSpecialSetting(key, value) {
        switch (key) {
            case 'debugMode':
                this._toggleDebugMode(value);
                break;
            case 'theme':
                this._applyTheme(value);
                break;
            case 'apiBaseUrl':
                console.log(`API base URL updated to: ${value}`);
                break;
        }
    }
    
    /**
     * Toggle debug mode features
     */
    _toggleDebugMode(enabled) {
        if (enabled) {
            console.log('Debug mode enabled');
            document.body.classList.add('debug-mode');
            
            // Add debug info to console
            console.group('Debug Information');
            console.log('Settings:', this.settings);
            console.log('User Agent:', navigator.userAgent);
            console.log('Screen:', `${screen.width}x${screen.height}`);
            console.log('Viewport:', `${window.innerWidth}x${window.innerHeight}`);
            console.groupEnd();
            
        } else {
            console.log('Debug mode disabled');
            document.body.classList.remove('debug-mode');
        }
    }
    
    /**
     * Apply theme settings
     */
    _applyTheme(theme) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        
        if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
        
        console.log(`Applied theme: ${theme}`);
    }
    
    /**
     * Check URL parameters for settings overrides
     */
    _checkUrlParameters() {
        const params = new URLSearchParams(window.location.search);
        
        // Debug mode override
        if (params.get('debug') === 'true') {
            this.updateSetting('debugMode', true);
        }
        
        // API base URL override
        const apiUrl = params.get('api');
        if (apiUrl) {
            this.updateSetting('apiBaseUrl', apiUrl);
        }
        
        // Theme override
        const theme = params.get('theme');
        if (theme) {
            this.updateSetting('theme', theme);
        }
        
        console.log('Checked URL parameters for settings overrides');
    }
    
    /**
     * Export settings as JSON
     */
    exportSettings() {
        const exportData = {
            settings: this.settings,
            timestamp: Date.now(),
            version: '1.0',
            userAgent: navigator.userAgent
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    /**
     * Import settings from JSON
     */
    importSettings(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.settings && typeof data.settings === 'object') {
                // Validate and merge settings
                const validKeys = Object.keys(this.settings);
                
                for (const [key, value] of Object.entries(data.settings)) {
                    if (validKeys.includes(key)) {
                        this.settings[key] = value;
                    }
                }
                
                this._saveSettings();
                this._updateUI();
                
                console.log('Settings imported successfully');
                return true;
            }
            
        } catch (error) {
            console.error('Failed to import settings:', error);
        }
        
        return false;
    }
    
    /**
     * Get API configuration
     */
    getApiConfig() {
        return {
            baseUrl: this.settings.apiBaseUrl,
            timeout: 30000, // 30 seconds
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        };
    }
    
    /**
     * Update API base URL and validate
     */
    async setApiBaseUrl(url) {
        // Basic URL validation
        try {
            new URL(url);
        } catch {
            throw new Error('Invalid URL format');
        }
        
        // Test connectivity (optional)
        try {
            const response = await fetch(`${url}/health`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                this.updateSetting('apiBaseUrl', url);
                console.log(`API base URL validated and updated: ${url}`);
                return true;
            } else {
                console.warn(`API health check failed: ${response.status}`);
            }
        } catch (error) {
            console.warn(`API connectivity test failed: ${error.message}`);
        }
        
        // Update anyway (maybe server is temporarily down)
        this.updateSetting('apiBaseUrl', url);
        return false;
    }
    
    /**
     * Load settings from localStorage
     */
    _loadSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.settings = { ...this.settings, ...parsed };
                console.log('Settings loaded from localStorage');
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }
    
    /**
     * Save settings to localStorage
     */
    _saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }
    
    /**
     * Clean up and destroy
     */
    destroy() {
        // Remove event listeners
        Object.values(this.elements).forEach(element => {
            if (element && element.removeEventListener) {
                // Clone and replace to remove all listeners
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            }
        });
        
        // Clear callbacks
        this.onSettingsChange = null;
        
        console.log('SettingsManager destroyed');
    }
}