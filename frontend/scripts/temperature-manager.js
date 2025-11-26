/**
 * TemperatureManager - Handles temperature data storage and calculations
 */
class TemperatureManager {
    constructor() {
        this.temperatureHistory = [];
        this.currentTemperature = 0;
        this.averageTemperature = 0;
        this.decayWindowMinutes = 15; // Default 15-minute decay window
        this.sensitivity = 5; // Scale 1-10, affects weighting
        
        // Event callbacks
        this.onTemperatureUpdate = null;
        
        // Storage keys
        this.storageKeys = {
            history: 'temperature_history',
            settings: 'temperature_settings'
        };
        
        // Load stored data
        this._loadFromStorage();
        
        // Clean up old data periodically
        this._startCleanupInterval();
    }
    
    /**
     * Add a new temperature reading
     * @param {number} temperature - Temperature value (1-100)
     * @param {number} confidence - Confidence level (0-1)
     * @param {string} source - Source of the reading (e.g., 'api', 'manual')
     */
    addReading(temperature, confidence = 1.0, source = 'api') {
        // Skip readings that indicate silence or no meaningful data
        // Only skip if confidence is very low AND temperature suggests silence
        if (confidence < 0.4 && temperature <= 25) {
            console.log(`Skipping low-confidence silence reading: ${temperature}° (confidence: ${confidence})`);
            // Don't add to history, but still notify listeners with current data
            if (this.onTemperatureUpdate) {
                this.onTemperatureUpdate({
                    current: this.currentTemperature, // Keep last known temperature
                    average: this.averageTemperature,
                    confidence: confidence,
                    readingCount: this.temperatureHistory.length
                });
            }
            return; // Exit early, don't add reading
        }
        
        const reading = {
            temperature: Math.max(1, Math.min(100, temperature)),
            confidence: Math.max(0, Math.min(1, confidence)),
            timestamp: Date.now(),
            source: source,
            id: this._generateId()
        };
        
        console.log(`Adding temperature reading: ${reading.temperature}° (confidence: ${reading.confidence})`);
        
        this.temperatureHistory.push(reading);
        this.currentTemperature = reading.temperature;
        
        // Recalculate weighted average
        this._calculateWeightedAverage();
        
        // Clean up old data
        this._cleanupOldReadings();
        
        // Save to storage
        this._saveToStorage();
        
        // Notify listeners
        if (this.onTemperatureUpdate) {
            this.onTemperatureUpdate({
                current: this.currentTemperature,
                average: this.averageTemperature,
                confidence: confidence,
                readingCount: this.temperatureHistory.length
            });
        }
    }
    
    /**
     * Calculate weighted average with time decay (excluding zero/initial values)
     */
    _calculateWeightedAverage() {
        // Filter out zero/initial values and very low confidence readings
        const validReadings = this.temperatureHistory.filter(reading => 
            reading.temperature > 0 && reading.confidence >= 0.3
        );
        
        if (validReadings.length === 0) {
            // Don't reset to 0 if we have no valid readings - keep last known value
            console.log('No valid readings for average calculation, keeping previous average');
            return;
        }
        
        const currentTime = Date.now();
        const decayWindowMs = this.decayWindowMinutes * 60 * 1000;
        
        let weightedSum = 0;
        let totalWeight = 0;
        
        // Apply time-based decay weighting
        for (const reading of validReadings) {
            const ageMs = currentTime - reading.timestamp;
            
            // Skip readings outside the decay window
            if (ageMs > decayWindowMs) continue;
            
            // Calculate time weight (1.0 at current time, 0.0 at decay window edge)
            const timeWeight = Math.max(0, 1 - (ageMs / decayWindowMs));
            
            // Apply sensitivity factor (higher sensitivity = more recent bias)
            const sensitivityFactor = Math.pow(timeWeight, (11 - this.sensitivity) / 5);
            
            // Apply confidence weighting
            const finalWeight = sensitivityFactor * reading.confidence;
            
            weightedSum += reading.temperature * finalWeight;
            totalWeight += finalWeight;
        }
        
        if (totalWeight > 0) {
            this.averageTemperature = Math.round(weightedSum / totalWeight);
            console.log(`Calculated weighted average: ${this.averageTemperature}° (from ${validReadings.length} valid readings)`);
        } else {
            console.log('No readings within decay window, keeping previous average');
        }
    }
    
    /**
     * Remove readings older than the decay window
     */
    _cleanupOldReadings() {
        const currentTime = Date.now();
        const decayWindowMs = this.decayWindowMinutes * 60 * 1000;
        
        const originalCount = this.temperatureHistory.length;
        
        this.temperatureHistory = this.temperatureHistory.filter(reading => {
            return (currentTime - reading.timestamp) <= decayWindowMs;
        });
        
        if (this.temperatureHistory.length !== originalCount) {
            console.log(`Cleaned up ${originalCount - this.temperatureHistory.length} old temperature readings`);
        }
    }
    
    /**
     * Get current temperature data
     */
    getCurrentData() {
        return {
            current: this.currentTemperature,
            average: this.averageTemperature,
            readingCount: this.temperatureHistory.length,
            lastReading: this.temperatureHistory.length > 0 ? 
                new Date(this.temperatureHistory[this.temperatureHistory.length - 1].timestamp) : null,
            decayWindowMinutes: this.decayWindowMinutes,
            sensitivity: this.sensitivity
        };
    }
    
    /**
     * Get temperature history for the specified time range
     * @param {number} minutes - Number of minutes back to retrieve
     */
    getHistory(minutes = null) {
        const lookbackMs = minutes ? minutes * 60 * 1000 : this.decayWindowMinutes * 60 * 1000;
        const currentTime = Date.now();
        
        return this.temperatureHistory
            .filter(reading => (currentTime - reading.timestamp) <= lookbackMs)
            .map(reading => ({
                temperature: reading.temperature,
                timestamp: reading.timestamp,
                confidence: reading.confidence,
                source: reading.source,
                ageMinutes: Math.round((currentTime - reading.timestamp) / (60 * 1000))
            }));
    }
    
    /**
     * Get temperature trend analysis
     */
    getTrend() {
        const recentReadings = this.getHistory(5); // Last 5 minutes
        if (recentReadings.length < 2) {
            return { direction: 'stable', magnitude: 0, confidence: 0 };
        }
        
        // Calculate trend using linear regression
        const n = recentReadings.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        
        recentReadings.forEach((reading, index) => {
            const x = index;
            const y = reading.temperature;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        });
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const magnitude = Math.abs(slope);
        
        let direction = 'stable';
        if (slope > 0.5) direction = 'rising';
        else if (slope < -0.5) direction = 'falling';
        
        return {
            direction,
            magnitude,
            confidence: Math.min(1, magnitude / 10), // Normalize to 0-1
            slope
        };
    }
    
    /**
     * Set sensitivity level (1-10)
     * @param {number} sensitivity - Higher values give more weight to recent readings
     */
    setSensitivity(sensitivity) {
        this.sensitivity = Math.max(1, Math.min(10, sensitivity));
        console.log(`Temperature sensitivity set to ${this.sensitivity}`);
        
        // Recalculate average with new sensitivity
        this._calculateWeightedAverage();
        this._saveToStorage();
        
        // Notify listeners
        if (this.onTemperatureUpdate) {
            this.onTemperatureUpdate(this.getCurrentData());
        }
    }
    
    /**
     * Set decay window duration
     * @param {number} minutes - Minutes for decay window (5-60)
     */
    setDecayWindow(minutes) {
        this.decayWindowMinutes = Math.max(5, Math.min(60, minutes));
        console.log(`Temperature decay window set to ${this.decayWindowMinutes} minutes`);
        
        // Clean up and recalculate
        this._cleanupOldReadings();
        this._calculateWeightedAverage();
        this._saveToStorage();
        
        // Notify listeners
        if (this.onTemperatureUpdate) {
            this.onTemperatureUpdate(this.getCurrentData());
        }
    }
    
    /**
     * Reset all temperature data (but don't start with zeros)
     */
    reset() {
        console.log('Resetting all temperature data');
        
        this.temperatureHistory = [];
        // Don't reset to 0 - leave at last known values or use neutral starting point
        // This prevents the graph and displays from starting with zero
        
        // Clear storage
        localStorage.removeItem(this.storageKeys.history);
        
        // Notify listeners - use current values, not zeros
        if (this.onTemperatureUpdate) {
            this.onTemperatureUpdate({
                current: this.currentTemperature, // Keep last known, don't reset to 0
                average: this.averageTemperature, // Keep last known, don't reset to 0
                confidence: 0,
                readingCount: 0
            });
        }
    }
    
    /**
     * Get temperature statistics
     */
    getStatistics() {
        if (this.temperatureHistory.length === 0) {
            return {
                min: 0,
                max: 0,
                average: 0,
                median: 0,
                stdDev: 0,
                readingCount: 0
            };
        }
        
        const temperatures = this.temperatureHistory.map(r => r.temperature);
        const sorted = [...temperatures].sort((a, b) => a - b);
        const sum = temperatures.reduce((a, b) => a + b, 0);
        const mean = sum / temperatures.length;
        
        const variance = temperatures.reduce((acc, temp) => acc + Math.pow(temp - mean, 2), 0) / temperatures.length;
        const stdDev = Math.sqrt(variance);
        
        return {
            min: Math.min(...temperatures),
            max: Math.max(...temperatures),
            average: Math.round(mean),
            median: sorted.length % 2 === 0 ? 
                (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 :
                sorted[Math.floor(sorted.length / 2)],
            stdDev: Math.round(stdDev * 100) / 100,
            readingCount: temperatures.length
        };
    }
    
    /**
     * Export temperature data for analysis
     */
    exportData() {
        const data = {
            history: this.temperatureHistory,
            statistics: this.getStatistics(),
            settings: {
                decayWindowMinutes: this.decayWindowMinutes,
                sensitivity: this.sensitivity
            },
            exportTimestamp: Date.now(),
            version: '1.0'
        };
        
        return JSON.stringify(data, null, 2);
    }
    
    /**
     * Import temperature data
     * @param {string} jsonData - JSON string of exported data
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.history && Array.isArray(data.history)) {
                this.temperatureHistory = data.history;
                this._calculateWeightedAverage();
                
                if (this.temperatureHistory.length > 0) {
                    this.currentTemperature = this.temperatureHistory[this.temperatureHistory.length - 1].temperature;
                }
            }
            
            if (data.settings) {
                if (data.settings.decayWindowMinutes) {
                    this.decayWindowMinutes = data.settings.decayWindowMinutes;
                }
                if (data.settings.sensitivity) {
                    this.sensitivity = data.settings.sensitivity;
                }
            }
            
            this._saveToStorage();
            
            // Notify listeners
            if (this.onTemperatureUpdate) {
                this.onTemperatureUpdate(this.getCurrentData());
            }
            
            console.log(`Imported ${this.temperatureHistory.length} temperature readings`);
            return true;
            
        } catch (error) {
            console.error('Failed to import temperature data:', error);
            return false;
        }
    }
    
    /**
     * Load data from localStorage
     */
    _loadFromStorage() {
        try {
            // Load history
            const historyData = localStorage.getItem(this.storageKeys.history);
            if (historyData) {
                this.temperatureHistory = JSON.parse(historyData);
                this._cleanupOldReadings();
                this._calculateWeightedAverage();
                
                if (this.temperatureHistory.length > 0) {
                    this.currentTemperature = this.temperatureHistory[this.temperatureHistory.length - 1].temperature;
                }
                
                console.log(`Loaded ${this.temperatureHistory.length} temperature readings from storage`);
            }
            
            // Load settings
            const settingsData = localStorage.getItem(this.storageKeys.settings);
            if (settingsData) {
                const settings = JSON.parse(settingsData);
                this.decayWindowMinutes = settings.decayWindowMinutes || this.decayWindowMinutes;
                this.sensitivity = settings.sensitivity || this.sensitivity;
                
                console.log(`Loaded temperature settings from storage`);
            }
            
        } catch (error) {
            console.error('Failed to load temperature data from storage:', error);
        }
    }
    
    /**
     * Save data to localStorage
     */
    _saveToStorage() {
        try {
            // Save history
            localStorage.setItem(this.storageKeys.history, JSON.stringify(this.temperatureHistory));
            
            // Save settings
            const settings = {
                decayWindowMinutes: this.decayWindowMinutes,
                sensitivity: this.sensitivity
            };
            localStorage.setItem(this.storageKeys.settings, JSON.stringify(settings));
            
        } catch (error) {
            console.error('Failed to save temperature data to storage:', error);
        }
    }
    
    /**
     * Start periodic cleanup of old data
     */
    _startCleanupInterval() {
        // Clean up every 5 minutes
        setInterval(() => {
            this._cleanupOldReadings();
            this._calculateWeightedAverage();
        }, 5 * 60 * 1000);
    }
    
    /**
     * Generate unique ID for readings
     */
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
}