// Robust Grid Evolution with comprehensive error handling
class GridEvolution {
    constructor(canvasId, config = {}) {
        this.canvasId = canvasId;
        this.config = config;
        this.isInitialized = false;
        this.debugMode = true;
        
        // Log initialization attempt
        this.log('GridEvolution constructor called with canvas ID:', canvasId);
        
        // Try to initialize, with fallback options
        this.initializeWithFallback();
    }
    
    initializeWithFallback() {
        try {
            // Method 1: Direct initialization
            if (this.tryInitializeDirect()) {
                this.log('Direct initialization successful');
                this.isInitialized = true;
                this.completeInitialization();
                return;
            }
            
            // Method 2: Wait for DOM ready
            this.log('Direct initialization failed, waiting for DOM...');
            this.waitForDOM(() => {
                if (this.tryInitializeDirect()) {
                    this.log('DOM-ready initialization successful');
                    this.isInitialized = true;
                    this.completeInitialization();
                } else {
                    this.logError('All initialization methods failed');
                    this.showErrorMessage();
                }
            });
            
        } catch (error) {
            this.logError('Critical error during initialization:', error);
            this.showErrorMessage();
        }
    }
    
    tryInitializeDirect() {
        try {
            // Find canvas element
            this.canvas = document.getElementById(this.canvasId);
            if (!this.canvas) {
                this.log('Canvas element not found:', this.canvasId);
                return false;
            }
            
            this.log('Canvas element found:', this.canvas);
            
            // Get canvas context
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                this.logError('Could not get 2d context from canvas');
                return false;
            }
            
            this.log('Canvas context obtained successfully');
            
            // Set up configuration
            this.gridSize = this.config.gridSize || 32;
            this.cellSize = this.config.cellSize || 20;
            this.padding = this.config.padding || 10;
            
            // Evolution parameters
            this.isRunning = false;
            this.currentStep = 0;
            this.maxSteps = this.config.maxSteps || 1000;
            this.evolutionSpeed = this.config.evolutionSpeed || 100;
            this.areaPreservation = this.config.areaPreservation !== false;
            
            // Cost function weights
            this.costWeights = {
                edgeSharpness: this.config.edgeSharpness || 1.0,
                cornerPenalty: this.config.cornerPenalty || 0.5,
                patternPenalty: this.config.patternPenalty || 2.0
            };
            
            // Initialize grid state
            this.initializeGrid();
            this.setupCanvas();
            this.bindEvents();
            
            // Calculate initial cost
            this.currentCost = this.calculateCost();
            
            return true;
            
        } catch (error) {
            this.logError('Error in tryInitializeDirect:', error);
            return false;
        }
    }
    
    waitForDOM(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            // DOM is already ready
            setTimeout(callback, 0);
        }
    }
    
    completeInitialization() {
        try {
            this.log('Completing initialization...');
            
            // Force initial render
            this.render();
            this.updateUI();
            
            // Set initial status
            this.updateStatus('Ready');
            
            this.log('Initialization completed successfully!', 'success');
            
        } catch (error) {
            this.logError('Error completing initialization:', error);
        }
    }
    
    showErrorMessage() {
        const container = document.getElementById('grid-canvas')?.parentElement;
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; border: 2px solid red; background: #ffebee;">
                    <h3 style="color: red;">Grid Visualization Error</h3>
                    <p>Could not initialize canvas. Please check:</p>
                    <ul style="text-align: left; display: inline-block;">
                        <li>Browser supports HTML5 Canvas</li>
                        <li>JavaScript is enabled</li>
                        <li>No browser extensions blocking canvas</li>
                    </ul>
                    <p><button onclick="location.reload()" style="margin-top: 10px; padding: 10px;">Reload Page</button></p>
                </div>
            `;
        }
    }
    
    // Grid state constants
    static STATES = {
        EMPTY: 0,
        FULL: 1,
        HALF_DIAG_TL_BR: 2,  // Top-left to bottom-right
        HALF_DIAG_TR_BL: 3,  // Top-right to bottom-left
        HALF_DIAG_BL_TR: 4,  // Bottom-left to top-right
        HALF_DIAG_BR_TL: 5   // Bottom-right to top-left
    };
    
    initializeGrid() {
        this.log('initializeGrid() called');
        this.grid = Array(this.gridSize).fill(null).map(() => 
            Array(this.gridSize).fill(GridEvolution.STATES.EMPTY)
        );
        this.totalArea = 0;
        this.targetArea = Math.floor(this.gridSize * this.gridSize * 0.3); // 30% target
        this.currentCost = 0;
        this.costHistory = [];
        this.log('Grid initialized, target area:', this.targetArea);
    }
    
    setupCanvas() {
        this.log('setupCanvas() called');
        const totalSize = this.gridSize * this.cellSize + 2 * this.padding;
        this.log('Calculated total size:', totalSize);
        
        this.canvas.width = totalSize;
        this.canvas.height = totalSize;
        this.log('Canvas dimensions set to:', this.canvas.width, 'x', this.canvas.height);
        
        this.canvas.style.border = '1px solid #e2e8f0';
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.backgroundColor = '#f8fafc';
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
        
        this.log('Canvas styles applied');
        
        // Force canvas clear
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.log('Canvas cleared');
    }
    
    bindEvents() {
        this.log('bindEvents() called');
        if (this.canvas) {
            this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
            this.log('Click event listener added');
        }
    }
    
    handleCanvasClick(e) {
        this.log('Canvas clicked');
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - this.padding;
        const y = e.clientY - rect.top - this.padding;
        
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        this.log('Click coordinates:', { x, y, row, col });
        
        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
            this.log('Valid cell clicked, toggling...');
            this.toggleCell(row, col);
            this.render();
        } else {
            this.log('Click outside grid area');
        }
    }
    
    toggleCell(row, col) {
        this.log('toggleCell called for:', row, col);
        const currentState = this.grid[row][col];
        const nextState = (currentState + 1) % 6;
        
        this.log('Changing state from', currentState, 'to', nextState);
        
        // Update area count
        const oldContribution = this.getAreaContribution(currentState);
        const newContribution = this.getAreaContribution(nextState);
        this.totalArea += newContribution - oldContribution;
        
        this.grid[row][col] = nextState;
        this.log('Cell toggled, new total area:', this.totalArea);
    }
    
    getAreaContribution(state) {
        switch(state) {
            case GridEvolution.STATES.EMPTY: return 0;
            case GridEvolution.STATES.FULL: return 1;
            default: return 0.5; // All half states
        }
    }
    
    render() {
        if (!this.isInitialized) {
            this.log('render() called but not initialized');
            return;
        }
        
        this.log('render() called');
        
        // Clear canvas with white background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        let cellCount = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.renderCell(row, col);
                cellCount++;
            }
        }
        
        this.log('Rendered', cellCount, 'cells');
        
        this.drawGridLines();
        this.log('Grid lines drawn');
    }
    
    renderCell(row, col) {
        const x = col * this.cellSize + this.padding;
        const y = row * this.cellSize + this.padding;
        const state = this.grid[row][col];
        
        this.ctx.save();
        
        switch(state) {
            case GridEvolution.STATES.EMPTY:
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                break;
                
            case GridEvolution.STATES.FULL:
                this.ctx.fillStyle = '#2563eb';
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                break;
                
            case GridEvolution.STATES.HALF_DIAG_TL_BR:
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                this.ctx.fillStyle = '#2563eb';
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + this.cellSize, y + this.cellSize);
                this.ctx.lineTo(x, y + this.cellSize);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case GridEvolution.STATES.HALF_DIAG_TR_BL:
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                this.ctx.fillStyle = '#2563eb';
                this.ctx.beginPath();
                this.ctx.moveTo(x + this.cellSize, y);
                this.ctx.lineTo(x, y + this.cellSize);
                this.ctx.lineTo(x + this.cellSize, y + this.cellSize);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case GridEvolution.STATES.HALF_DIAG_BL_TR:
                this.ctx.fillStyle = '#2563eb';
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + this.cellSize, y + this.cellSize);
                this.ctx.lineTo(x, y + this.cellSize);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case GridEvolution.STATES.HALF_DIAG_BR_TL:
                this.ctx.fillStyle = '#2563eb';
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.moveTo(x + this.cellSize, y);
                this.ctx.lineTo(x, y + this.cellSize);
                this.ctx.lineTo(x + this.cellSize, y + this.cellSize);
                this.ctx.closePath();
                this.ctx.fill();
                break;
        }
        
        this.ctx.restore();
    }
    
    drawGridLines() {
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.gridSize; i++) {
            const pos = i * this.cellSize + this.padding;
            
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(pos, this.padding);
            this.ctx.lineTo(pos, this.gridSize * this.cellSize + this.padding);
            this.ctx.stroke();
            
            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, pos);
            this.ctx.lineTo(this.gridSize * this.cellSize + this.padding, pos);
            this.ctx.stroke();
        }
    }
    
    calculateCost() {
        let totalCost = 0;
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                totalCost += this.getCellCost(row, col);
            }
        }
        
        // Area preservation penalty
        if (this.areaPreservation) {
            const areaDiff = Math.abs(this.totalArea - this.targetArea);
            totalCost += areaDiff * 10;
        }
        
        return totalCost;
    }
    
    getCellCost(row, col) {
        let cellCost = 0;
        const state = this.grid[row][col];
        
        // Edge sharpness penalty (favors smooth edges)
        const neighbors = this.getNeighbors(row, col);
        const differentNeighbors = neighbors.filter(n => this.grid[n.row][n.col] !== state).length;
        cellCost += differentNeighbors * this.costWeights.edgeSharpness;
        
        // Corner penalty (sharp corners are penalized)
        if (this.isSharpCorner(row, col)) {
            cellCost += this.costWeights.cornerPenalty * 5;
        }
        
        // Pattern penalty (checkerboard and zebra patterns)
        if (this.hasPattern(row, col)) {
            cellCost += this.costWeights.patternPenalty * 3;
        }
        
        return cellCost;
    }
    
    getNeighbors(row, col) {
        const neighbors = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
                neighbors.push({row: newRow, col: newCol});
            }
        }
        
        return neighbors;
    }
    
    isSharpCorner(row, col) {
        const state = this.grid[row][col];
        if (state === GridEvolution.STATES.EMPTY) return false;
        
        // Check for sharp corner patterns
        const patterns = [
            // Top-left corner
            [[-1, -1], [-1, 0], [0, -1]],
            // Top-right corner
            [[-1, 0], [-1, 1], [0, 1]],
            // Bottom-left corner
            [[0, -1], [1, -1], [1, 0]],
            // Bottom-right corner
            [[0, 1], [1, 0], [1, 1]]
        ];
        
        for (const pattern of patterns) {
            const [p1, p2, p3] = pattern;
            const s1 = this.getStateSafe(row + p1[0], col + p1[1]);
            const s2 = this.getStateSafe(row + p2[0], col + p2[1]);
            const s3 = this.getStateSafe(row + p3[0], col + p3[1]);
            
            if (s1 === GridEvolution.STATES.EMPTY && s2 === GridEvolution.STATES.EMPTY && s3 === GridEvolution.STATES.EMPTY) {
                return true;
            }
        }
        
        return false;
    }
    
    hasPattern(row, col) {
        // Check for checkerboard pattern
        const checkerboard = this.checkCheckerboard(row, col);
        
        // Check for zebra pattern (alternating rows/columns)
        const zebra = this.checkZebraPattern(row, col);
        
        return checkerboard || zebra;
    }
    
    checkCheckerboard(row, col) {
        const neighbors = this.getNeighbors(row, col);
        const currentState = this.grid[row][col];
        
        let alternating = 0;
        for (const neighbor of neighbors) {
            if (this.grid[neighbor.row][neighbor.col] !== currentState) {
                alternating++;
            }
        }
        
        return alternating >= 6; // High alternation suggests checkerboard
    }
    
    checkZebraPattern(row, col) {
        const currentState = this.grid[row][col];
        
        // Check row alternation
        let rowAlternating = true;
        for (let c = 0; c < this.gridSize; c++) {
            if (c !== col && this.grid[row][c] === currentState) {
                if ((c - col) % 2 !== 0) {
                    rowAlternating = false;
                    break;
                }
            }
        }
        
        // Check column alternation
        let colAlternating = true;
        for (let r = 0; r < this.gridSize; r++) {
            if (r !== row && this.grid[r][col] === currentState) {
                if ((r - row) % 2 !== 0) {
                    colAlternating = false;
                    break;
                }
            }
        }
        
        return rowAlternating || colAlternating;
    }
    
    getStateSafe(row, col) {
        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
            return this.grid[row][col];
        }
        return GridEvolution.STATES.EMPTY;
    }
    
    evolveStep() {
        this.log('evolveStep() called, isRunning:', this.isRunning);
        if (!this.isRunning) return;
        
        // Find candidate cells to change
        const candidates = this.findEvolutionCandidates();
        this.log('Found', candidates.length, 'candidates');
        
        if (candidates.length > 0) {
            // Apply the best change
            const bestChange = candidates[0];
            this.log('Applying best change:', bestChange);
            this.applyChange(bestChange.row, bestChange.col, bestChange.newState);
        }
        
        this.currentStep++;
        this.currentCost = this.calculateCost();
        this.costHistory.push(this.currentCost);
        
        this.log('Step completed. New cost:', this.currentCost);
        
        // Check termination conditions
        if (this.shouldTerminate()) {
            this.log('Termination condition reached');
            this.stopEvolution();
        }
        
        this.render();
        this.updateUI();
    }
    
    findEvolutionCandidates() {
        const candidates = [];
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const currentState = this.grid[row][col];
                
                // Try all possible state changes
                for (let newState = 0; newState < 6; newState++) {
                    if (newState === currentState) continue;
                    
                    const costChange = this.calculateCostChange(row, col, newState);
                    candidates.push({
                        row, col, newState, costChange
                    });
                }
            }
        }
        
        // Sort by cost improvement (most negative first)
        return candidates.filter(c => c.costChange < -0.1).sort((a, b) => a.costChange - b.costChange);
    }
    
    calculateCostChange(row, col, newState) {
        const oldState = this.grid[row][col];
        
        // Temporarily apply the change
        this.grid[row][col] = newState;
        const newCost = this.calculateCost();
        
        // Revert the change
        this.grid[row][col] = oldState;
        
        return newCost - this.currentCost;
    }
    
    applyChange(row, col, newState) {
        const oldState = this.grid[row][col];

        // Update area count if area preservation is enabled
        if (this.areaPreservation) {
            const oldContribution = this.getAreaContribution(oldState);
            const newContribution = this.getAreaContribution(newState);
            const newTotalArea = this.totalArea + newContribution - oldContribution;

            // Allow changes that move toward target area, but prevent overshooting by too much
            // Allow some flexibility when building up from empty, then enforce preservation
            if (this.totalArea < this.targetArea * 0.8) {
                // Building phase: allow adding cells up to 80% of target
                if (newTotalArea <= this.targetArea * 0.8) {
                    // Allow growth toward target
                } else if (newContribution <= oldContribution) {
                    // Allow removals even when above 80%
                } else {
                    return false; // Reject excessive growth
                }
            } else {
                // Preservation phase: stay close to target area (±2 units tolerance)
                if (Math.abs(newTotalArea - this.targetArea) > 2) {
                    return false; // Reject change that deviates too much from target
                }
            }
        }
        
        this.grid[row][col] = newState;
        
        // Update area tracking
        const oldContribution = this.getAreaContribution(oldState);
        const newContribution = this.getAreaContribution(newState);
        this.totalArea += newContribution - oldContribution;
        
        return true;
    }
    
    shouldTerminate() {
        // Maximum steps reached
        if (this.currentStep >= this.maxSteps) return true;
        
        // Cost convergence (no significant improvement)
        if (this.costHistory.length > 10) {
            const recentCosts = this.costHistory.slice(-10);
            const maxChange = Math.max(...recentCosts) - Math.min(...recentCosts);
            if (maxChange < 0.1) return true;
        }
        
        // Cost below threshold
        if (this.currentCost < 0.1 * this.gridSize * this.gridSize) return true;
        
        return false;
    }
    
    startEvolution() {
        this.log('startEvolution() called');
        this.isRunning = true;
        this.evolveLoop();
    }
    
    stopEvolution() {
        this.log('stopEvolution() called');
        this.isRunning = false;
    }
    
    evolveLoop() {
        this.log('evolveLoop() called, isRunning:', this.isRunning);
        if (this.isRunning) {
            this.evolveStep();
            setTimeout(() => this.evolveLoop(), this.evolutionSpeed);
        }
    }
    
    reset() {
        this.log('reset() called');
        this.stopEvolution();
        this.currentStep = 0;
        this.currentCost = 0;
        this.costHistory = [];
        this.totalArea = 0;
        this.initializeGrid();
        this.render();
        this.updateUI();
    }
    
    randomize() {
        this.log('randomize() called');
        this.reset();
        
        // Create random initial configuration
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (Math.random() < 0.3) { // 30% chance of being occupied
                    const state = Math.floor(Math.random() * 6);
                    this.grid[row][col] = state;
                    this.totalArea += this.getAreaContribution(state);
                }
            }
        }
        
        this.currentCost = this.calculateCost();
        this.render();
        this.updateUI();
    }
    
    updateUI() {
        this.log('updateUI() called');
        // Update UI elements (to be connected to HTML)
        const stepElement = document.getElementById('step-counter');
        const costElement = document.getElementById('cost-display');
        const statusElement = document.getElementById('status-display');
        const areaElement = document.getElementById('area-display');
        
        if (stepElement) {
            stepElement.textContent = this.currentStep;
        }
        if (costElement) {
            costElement.textContent = this.currentCost.toFixed(2);
        }
        if (statusElement) {
            statusElement.textContent = this.isRunning ? 'Running' : 'Stopped';
        }
        if (areaElement) {
            areaElement.textContent = `${this.totalArea.toFixed(1)} / ${this.targetArea}`;
        }
    }
    
    updateStatus(status) {
        const statusElement = document.getElementById('status-display');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
    
    resizeGrid(newSize) {
        this.log('resizeGrid called with:', newSize);
        this.stopEvolution();
        this.gridSize = newSize;
        this.setupCanvas();
        this.reset();
        
        // Force immediate render
        setTimeout(() => {
            this.render();
        }, 50);
    }
    
    setEvolutionSpeed(speed) {
        this.evolutionSpeed = speed;
    }
    
    setCostWeight(type, value) {
        this.costWeights[type] = value;
        this.currentCost = this.calculateCost();
        this.updateUI();
    }
    
    // Logging methods
    log(...args) {
        if (this.debugMode) {
            console.log('[GridEvolution]', ...args);
        }
    }
    
    logError(...args) {
        console.error('[GridEvolution ERROR]', ...args);
    }
}