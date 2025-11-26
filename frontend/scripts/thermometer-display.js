/**
 * ThermometerDisplay - Handles the visual thermometer display and animations
 */
class ThermometerDisplay {
    constructor(svgElement) {
        this.svg = svgElement;
        this.temperatureFill = this.svg.querySelector('#temperature-fill');
        this.temperatureText = this.svg.querySelector('#temperature-text');
        this.bulbFill = this.svg.querySelector('#bulb-fill');
        this.thermometerContainer = this.svg.closest('.thermometer-container');
        
        // Current state
        this.currentTemperature = 0;
        this.targetTemperature = 0;
        this.animationId = null;
        
        // Animation settings
        this.animationDuration = 1000; // 1 second
        this.animationEasing = 'ease-out';
        
        // Temperature ranges and colors
        this.temperatureRanges = {
            cold: { min: 0, max: 20, color: '#0088ff', gradient: ['#0088ff', '#44aaff'] },
            cool: { min: 21, max: 40, color: '#44aaff', gradient: ['#44aaff', '#66ccff'] },
            warm: { min: 41, max: 70, color: '#ffaa00', gradient: ['#ffaa00', '#ffcc44'] },
            hot: { min: 71, max: 100, color: '#ff4444', gradient: ['#ff4444', '#ff6666'] }
        };
        
        // Thermometer dimensions (based on SVG structure)
        // Inner tube: y="22" height="226" (goes from y=22 to y=248)
        // Fill should go from bottom of tube upward
        this.fillArea = {
            x: 44,          // Same as fill element x
            topY: 22,       // Top of inner tube  
            width: 12,      // Same as fill element width
            maxHeight: 226, // Height of the inner tube (248 - 22 = 226)
            bottomY: 248    // Bottom of inner tube (22 + 226 = 248)
        };
        
        this._initializeBulb();
        
        // Initialize with 0 temperature
        this.updateTemperature(0, false);
        
        console.log('ThermometerDisplay initialized');
    }
    
    /**
     * Create a dynamic gradient that goes from blue at bottom to the appropriate color at the temperature level
     */
    _createDynamicGradient(temperature) {
        // Get appropriate color for this temperature
        const targetColor = this._getTemperatureColor(temperature);
        
        // Create or update dynamic gradient
        let defs = this.svg.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            this.svg.insertBefore(defs, this.svg.firstChild);
        }
        
        const gradientId = 'dynamic-temp-gradient';
        let gradient = defs.querySelector(`#${gradientId}`);
        
        if (!gradient) {
            gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            gradient.setAttribute('id', gradientId);
            gradient.setAttribute('x1', '0%');
            gradient.setAttribute('y1', '100%'); // Start from bottom
            gradient.setAttribute('x2', '0%');
            gradient.setAttribute('y2', '0%');   // End at top
            defs.appendChild(gradient);
        }
        
        // Clear existing stops
        gradient.innerHTML = '';
        
        // Always start with blue at the bottom
        const bottomStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        bottomStop.setAttribute('offset', '0%');
        bottomStop.setAttribute('stop-color', '#0088ff'); // Always blue at bottom
        gradient.appendChild(bottomStop);
        
        // Add target color at the top (based on temperature level)
        const topStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        topStop.setAttribute('offset', '100%');
        topStop.setAttribute('stop-color', targetColor);
        gradient.appendChild(topStop);
        
        // Apply the gradient to the fill
        this.temperatureFill.setAttribute('fill', `url(#${gradientId})`);
    }
    
    /**
     * Get appropriate color for temperature value (smooth interpolation)
     */
    _getTemperatureColor(temperature) {
        // Define color points along the temperature scale
        const colorPoints = [
            { temp: 0, color: [0, 136, 255] },    // Blue
            { temp: 25, color: [68, 170, 255] },  // Light blue
            { temp: 50, color: [255, 170, 0] },   // Orange
            { temp: 75, color: [255, 136, 68] },  // Red-orange  
            { temp: 100, color: [255, 68, 68] }   // Red
        ];
        
        // Find the two color points to interpolate between
        let lowerPoint = colorPoints[0];
        let upperPoint = colorPoints[colorPoints.length - 1];
        
        for (let i = 0; i < colorPoints.length - 1; i++) {
            if (temperature >= colorPoints[i].temp && temperature <= colorPoints[i + 1].temp) {
                lowerPoint = colorPoints[i];
                upperPoint = colorPoints[i + 1];
                break;
            }
        }
        
        // Calculate interpolation factor
        const range = upperPoint.temp - lowerPoint.temp;
        const factor = range === 0 ? 0 : (temperature - lowerPoint.temp) / range;
        
        // Interpolate RGB values
        const r = Math.round(lowerPoint.color[0] + (upperPoint.color[0] - lowerPoint.color[0]) * factor);
        const g = Math.round(lowerPoint.color[1] + (upperPoint.color[1] - lowerPoint.color[1]) * factor);
        const b = Math.round(lowerPoint.color[2] + (upperPoint.color[2] - lowerPoint.color[2]) * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * Initialize SVG gradients for temperature colors (legacy method)
     */
    _initializeGradients() {
        // Create defs element if it doesn't exist
        let defs = this.svg.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            this.svg.insertBefore(defs, this.svg.firstChild);
        }
        
        // Create gradients for each temperature range
        Object.entries(this.temperatureRanges).forEach(([range, config]) => {
            const gradientId = `gradient-${range}`;
            
            // Remove existing gradient
            const existing = defs.querySelector(`#${gradientId}`);
            if (existing) existing.remove();
            
            // Create new gradient
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            gradient.setAttribute('id', gradientId);
            gradient.setAttribute('x1', '0%');
            gradient.setAttribute('y1', '100%');
            gradient.setAttribute('x2', '0%');
            gradient.setAttribute('y2', '0%');
            
            // Create gradient stops
            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', config.gradient[0]);
            
            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '100%');
            stop2.setAttribute('stop-color', config.gradient[1]);
            
            gradient.appendChild(stop1);
            gradient.appendChild(stop2);
            defs.appendChild(gradient);
        });
        
        console.log('Temperature gradients initialized');
    }
    
    /**
     * Initialize thermometer bulb
     */
    _initializeBulb() {
        if (this.bulbFill) {
            this.bulbFill.classList.add('active');
        }
    }
    
    /**
     * Update the thermometer display with a new temperature
     * @param {number} temperature - Temperature value (0-100)
     * @param {boolean} animate - Whether to animate the change
     */
    updateTemperature(temperature, animate = true) {
        // Handle invalid input values
        if (typeof temperature !== 'number' || isNaN(temperature)) {
            console.warn(`Invalid temperature value: ${temperature}, using 0`);
            temperature = 0;
        }
        
        const newTemp = Math.max(0, Math.min(100, temperature));
        
        if (newTemp === this.currentTemperature) {
            return; // No change needed
        }
        
        console.log(`Updating thermometer: ${this.currentTemperature}° → ${newTemp}°`);
        
        this.targetTemperature = newTemp;
        
        if (animate) {
            this._animateToTemperature(newTemp);
        } else {
            this._setTemperatureImmediate(newTemp);
        }
        
        // Update temperature range styling
        this._updateTemperatureRange(newTemp);
        
        // Update bulb color
        this._updateBulbColor(newTemp);
    }
    
    /**
     * Animate temperature change
     */
    _animateToTemperature(targetTemp) {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const startTemp = this.currentTemperature;
        const tempDiff = targetTemp - startTemp;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.animationDuration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            const currentTemp = startTemp + (tempDiff * easeOut);
            this._setTemperatureImmediate(currentTemp);
            
            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.animationId = null;
                this.currentTemperature = targetTemp;
            }
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    /**
     * Set temperature immediately without animation
     */
    _setTemperatureImmediate(temperature) {
        // Ensure temperature is within valid bounds
        const clampedTemp = Math.max(0, Math.min(100, temperature));
        this.currentTemperature = clampedTemp;
        
        // Calculate fill height and position with bounds checking
        const fillHeight = Math.max(0, (clampedTemp / 100) * this.fillArea.maxHeight);
        const fillY = Math.max(this.fillArea.topY, this.fillArea.bottomY - fillHeight); // Start from bottom, go up, but don't exceed top
        
        // Debug logging for temperature fill
        console.log(`[Thermometer] Temp: ${clampedTemp}°`);
        console.log(`[Thermometer] Fill height: ${fillHeight.toFixed(1)}, Y: ${fillY.toFixed(1)}`);
        console.log(`[Thermometer] Fill element:`, this.temperatureFill);
        console.log(`[Thermometer] Setting y="${Math.round(fillY)}" height="${Math.round(fillHeight)}"`);
        
        // Update fill element with safe values
        this.temperatureFill.setAttribute('y', Math.round(fillY).toString());
        this.temperatureFill.setAttribute('height', Math.round(fillHeight).toString());
        
        // CRITICAL: Apply the gradient every time we update the fill
        this._createDynamicGradient(clampedTemp);
        
        // Update temperature text
        const displayTemp = Math.round(clampedTemp);
        this.temperatureText.textContent = displayTemp === 0 ? '--°' : `${displayTemp}°`;
        
        // Add animation class for visual feedback
        this.temperatureFill.classList.add('animating');
        setTimeout(() => {
            this.temperatureFill.classList.remove('animating');
        }, 500);
    }
    
    /**
     * Update temperature range styling (gradient now handled in _setTemperatureImmediate)
     */
    _updateTemperatureRange(temperature) {
        const range = this._getTemperatureRange(temperature);
        
        // Note: Dynamic gradient creation moved to _setTemperatureImmediate for better timing
        
        // Update container classes
        this.thermometerContainer.classList.remove('temp-cold', 'temp-cool', 'temp-warm', 'temp-hot');
        this.thermometerContainer.classList.add(`temp-${range}`);
        
        // Add alert classes for extreme temperatures
        this.thermometerContainer.classList.remove('temp-alert-hot', 'temp-alert-cool', 'temp-critical');
        
        if (temperature >= 90) {
            this.thermometerContainer.classList.add('temp-critical');
        } else if (temperature >= 80) {
            this.thermometerContainer.classList.add('temp-alert-hot');
        } else if (temperature <= 10) {
            this.thermometerContainer.classList.add('temp-alert-cool');
        }
    }
    
    /**
     * Update bulb color based on temperature
     */
    _updateBulbColor(temperature) {
        if (!this.bulbFill) return;
        
        const range = this._getTemperatureRange(temperature);
        const color = this.temperatureRanges[range].color;
        
        // Update bulb fill color
        this.bulbFill.setAttribute('fill', color);
        
        // Add pulsing effect for high temperatures
        if (temperature >= 80) {
            this.thermometerContainer.classList.add('temp-critical');
        } else {
            this.thermometerContainer.classList.remove('temp-critical');
        }
    }
    
    /**
     * Get temperature range for a given value
     */
    _getTemperatureRange(temperature) {
        for (const [range, config] of Object.entries(this.temperatureRanges)) {
            if (temperature >= config.min && temperature <= config.max) {
                return range;
            }
        }
        return 'cool'; // Default fallback
    }
    
    /**
     * Add visual effect for temperature change direction
     */
    addTrendEffect(direction) {
        this.temperatureFill.classList.remove('temp-rising', 'temp-falling');
        
        if (direction === 'rising') {
            this.temperatureFill.classList.add('temp-rising');
        } else if (direction === 'falling') {
            this.temperatureFill.classList.add('temp-falling');
        }
        
        // Remove effect after animation completes
        setTimeout(() => {
            this.temperatureFill.classList.remove('temp-rising', 'temp-falling');
        }, 500);
    }
    
    /**
     * Reset thermometer to initial state
     */
    reset() {
        console.log('Resetting thermometer display');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.currentTemperature = 0;
        this.targetTemperature = 0;
        
        this._setTemperatureImmediate(0);
        this._updateTemperatureRange(0);
        this._updateBulbColor(0);
        
        // Remove all effect classes
        this.thermometerContainer.classList.remove(
            'temp-cold', 'temp-cool', 'temp-warm', 'temp-hot',
            'temp-alert-hot', 'temp-alert-cool', 'temp-critical'
        );
        this.temperatureFill.classList.remove('temp-rising', 'temp-falling', 'animating');
    }
    
    /**
     * Set custom color theme
     */
    setColorTheme(theme) {
        if (theme.ranges) {
            this.temperatureRanges = { ...this.temperatureRanges, ...theme.ranges };
            this._initializeGradients();
            this._updateTemperatureRange(this.currentTemperature);
        }
        
        console.log('Applied custom color theme');
    }
    
    /**
     * Get current display state
     */
    getState() {
        return {
            currentTemperature: this.currentTemperature,
            targetTemperature: this.targetTemperature,
            isAnimating: !!this.animationId,
            temperatureRange: this._getTemperatureRange(this.currentTemperature)
        };
    }
    
    /**
     * Enable or disable animations
     */
    setAnimationsEnabled(enabled) {
        if (!enabled) {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            this.animationDuration = 0;
        } else {
            this.animationDuration = 1000;
        }
        
        console.log(`Thermometer animations ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Pulse effect for active recording
     */
    startRecordingEffect() {
        this.thermometerContainer.classList.add('recording-active');
        const bulb = this.svg.querySelector('.thermometer-bulb');
        if (bulb) {
            bulb.classList.add('recording-pulse');
        }
    }
    
    /**
     * Stop recording effect
     */
    stopRecordingEffect() {
        this.thermometerContainer.classList.remove('recording-active');
        const bulb = this.svg.querySelector('.thermometer-bulb');
        if (bulb) {
            bulb.classList.remove('recording-pulse');
        }
    }
    
    /**
     * Show processing effect
     */
    showProcessingEffect() {
        this.temperatureFill.classList.add('processing');
        setTimeout(() => {
            this.temperatureFill.classList.remove('processing');
        }, 3000);
    }
    
    /**
     * Cleanup and destroy
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Remove event listeners if any
        // Clean up classes
        this.thermometerContainer.classList.remove(
            'temp-cold', 'temp-cool', 'temp-warm', 'temp-hot',
            'temp-alert-hot', 'temp-alert-cool', 'temp-critical',
            'recording-active'
        );
        
        console.log('ThermometerDisplay destroyed');
    }
}