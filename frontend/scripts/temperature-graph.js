/**
 * TemperatureGraph - Handles the background temperature timeline graph
 */
class TemperatureGraph {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        
        // Data storage
        this.dataPoints = [];
        this.sessionStartTime = Date.now();
        
        // Graph settings
        this.minTemp = 0;
        this.maxTemp = 100;
        this.padding = 20;
        
        // Colors matching thermometer
        this.colors = {
            cold: '#0088ff',
            cool: '#44aaff', 
            warm: '#ffaa00',
            hot: '#ff4444'
        };
        
        // Animation
        this.animationId = null;
        this.isAnimating = false;
        
        // Setup canvas
        this._setupCanvas();
        this._setupResizeObserver();
        
        console.log('TemperatureGraph initialized');
    }
    
    /**
     * Setup canvas with proper dimensions and pixel ratio
     */
    _setupCanvas() {
        const updateCanvasSize = () => {
            const rect = this.canvas.getBoundingClientRect();
            const pixelRatio = window.devicePixelRatio || 1;
            
            // Set actual canvas size
            this.canvas.width = rect.width * pixelRatio;
            this.canvas.height = rect.height * pixelRatio;
            
            // Scale context to match pixel ratio
            this.ctx.scale(pixelRatio, pixelRatio);
            
            // Set CSS size
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
            
            this._draw();
        };
        
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
    }
    
    /**
     * Setup resize observer for responsive canvas
     */
    _setupResizeObserver() {
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => {
                this._setupCanvas();
            });
            resizeObserver.observe(this.canvas.parentElement);
        }
    }
    
    /**
     * Add new temperature reading
     * @param {number} temperature - Temperature value (0-100)
     * @param {number} timestamp - Timestamp of reading
     */
    addDataPoint(temperature, timestamp = Date.now()) {
        const dataPoint = {
            temperature: Math.max(0, Math.min(100, temperature)),
            timestamp: timestamp,
            id: this._generateId()
        };
        
        this.dataPoints.push(dataPoint);
        
        console.log(`Added temperature data point: ${temperature}° at ${new Date(timestamp).toLocaleTimeString()}`);
        
        // Animate new point
        this._animateNewPoint();
    }
    
    /**
     * Clear all data points (new session)
     */
    reset() {
        this.dataPoints = [];
        this.sessionStartTime = Date.now();
        this._draw();
        console.log('Temperature graph reset');
    }
    
    /**
     * Draw the complete graph
     */
    _draw() {
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);
        
        if (this.dataPoints.length === 0) {
            this._drawEmptyState(width, height);
            return;
        }
        
        // Calculate time range
        const currentTime = Date.now();
        const timeRange = Math.max(currentTime - this.sessionStartTime, 60000); // At least 1 minute
        
        // Draw temperature zones (background)
        this._drawTemperatureZones(width, height);
        
        // Draw data as filled area
        this._drawTemperatureArea(width, height, timeRange);
        
        // Draw grid lines
        this._drawGrid(width, height);
    }
    
    /**
     * Draw empty state
     */
    _drawEmptyState(width, height) {
        this.ctx.fillStyle = 'rgba(100, 116, 139, 0.3)';
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Temperature timeline will appear here', width / 2, height / 2);
    }
    
    /**
     * Draw temperature zones as subtle background bands
     */
    _drawTemperatureZones(width, height) {
        const zones = [
            { min: 0, max: 25, color: this.colors.cold, alpha: 0.05 },
            { min: 25, max: 50, color: this.colors.cool, alpha: 0.05 },
            { min: 50, max: 75, color: this.colors.warm, alpha: 0.05 },
            { min: 75, max: 100, color: this.colors.hot, alpha: 0.05 }
        ];
        
        zones.forEach(zone => {
            const y1 = this._temperatureToY(zone.max, height);
            const y2 = this._temperatureToY(zone.min, height);
            
            this.ctx.fillStyle = zone.color + Math.round(zone.alpha * 255).toString(16).padStart(2, '0');
            this.ctx.fillRect(this.padding, y1, width - 2 * this.padding, y2 - y1);
        });
    }
    
    /**
     * Draw temperature data as filled area with gradient
     */
    _drawTemperatureArea(width, height, timeRange) {
        if (this.dataPoints.length < 2) {
            // Single point - draw as vertical line
            if (this.dataPoints.length === 1) {
                const point = this.dataPoints[0];
                const x = this._timeToX(point.timestamp, width, timeRange);
                const y = this._temperatureToY(point.temperature, height);
                
                this.ctx.strokeStyle = this._getTemperatureColor(point.temperature);
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(x, height - this.padding);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            }
            return;
        }
        
        // Create path for filled area
        const path = new Path2D();
        const gradientPoints = [];
        
        // Start from bottom-left
        const firstPoint = this.dataPoints[0];
        const firstX = this._timeToX(firstPoint.timestamp, width, timeRange);
        path.moveTo(firstX, height - this.padding);
        
        // Draw line through all points
        this.dataPoints.forEach(point => {
            const x = this._timeToX(point.timestamp, width, timeRange);
            const y = this._temperatureToY(point.temperature, height);
            
            path.lineTo(x, y);
            gradientPoints.push({ x, y, temp: point.temperature });
        });
        
        // Close path at bottom
        const lastPoint = this.dataPoints[this.dataPoints.length - 1];
        const lastX = this._timeToX(lastPoint.timestamp, width, timeRange);
        path.lineTo(lastX, height - this.padding);
        path.closePath();
        
        // Create gradient fill
        const gradient = this._createTemperatureGradient(gradientPoints, height);
        this.ctx.fillStyle = gradient;
        this.ctx.fill(path);
        
        // Draw outline
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke(path);
    }
    
    /**
     * Create gradient based on temperature values
     */
    _createTemperatureGradient(gradientPoints, height) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        
        // Add color stops based on temperature ranges
        gradient.addColorStop(0, this.colors.hot + '80'); // 50% opacity
        gradient.addColorStop(0.25, this.colors.warm + '80');
        gradient.addColorStop(0.75, this.colors.cool + '80');
        gradient.addColorStop(1, this.colors.cold + '80');
        
        return gradient;
    }
    
    /**
     * Draw grid lines
     */
    _drawGrid(width, height) {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Horizontal lines (temperature)
        const tempSteps = [0, 25, 50, 75, 100];
        tempSteps.forEach(temp => {
            const y = this._temperatureToY(temp, height);
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, y);
            this.ctx.lineTo(width - this.padding, y);
            this.ctx.stroke();
        });
        
        // Vertical lines (time) - only if we have a reasonable time range
        if (this.dataPoints.length > 0) {
            const timeRange = Date.now() - this.sessionStartTime;
            const timeSteps = Math.max(1, Math.floor(timeRange / (5 * 60 * 1000))); // Every 5 minutes
            
            for (let i = 0; i <= timeSteps; i++) {
                const time = this.sessionStartTime + (i * timeRange / timeSteps);
                const x = this._timeToX(time, width, timeRange);
                
                if (x >= this.padding && x <= width - this.padding) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, this.padding);
                    this.ctx.lineTo(x, height - this.padding);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    /**
     * Convert temperature to Y coordinate
     */
    _temperatureToY(temperature, height) {
        const graphHeight = height - 2 * this.padding;
        const normalizedTemp = (temperature - this.minTemp) / (this.maxTemp - this.minTemp);
        return height - this.padding - (normalizedTemp * graphHeight);
    }
    
    /**
     * Convert timestamp to X coordinate
     */
    _timeToX(timestamp, width, timeRange) {
        const graphWidth = width - 2 * this.padding;
        const normalizedTime = (timestamp - this.sessionStartTime) / timeRange;
        return this.padding + (normalizedTime * graphWidth);
    }
    
    /**
     * Get color for temperature value
     */
    _getTemperatureColor(temperature) {
        if (temperature >= 75) return this.colors.hot;
        if (temperature >= 50) return this.colors.warm;
        if (temperature >= 25) return this.colors.cool;
        return this.colors.cold;
    }
    
    /**
     * Animate new data point
     */
    _animateNewPoint() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        // Simple redraw with slight delay for smooth appearance
        requestAnimationFrame(() => {
            this._draw();
            this.isAnimating = false;
        });
    }
    
    /**
     * Generate unique ID
     */
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Get current graph state
     */
    getState() {
        return {
            dataPointCount: this.dataPoints.length,
            sessionStartTime: this.sessionStartTime,
            timeRange: this.dataPoints.length > 0 ? Date.now() - this.sessionStartTime : 0
        };
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        console.log('TemperatureGraph destroyed');
    }
}