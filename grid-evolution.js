// Grid Evolution - Main orchestrator class
// This is the new, refactored version of the GridEvolution class

import { GridCore } from './grid-core.js';
import { GridRenderer } from './grid-renderer.js';
import { EnhancedEnergySystem } from './enhanced-energy-system.js';
import { EvolutionEngine } from './evolution-engine.js';
import { UIController } from './ui-controller.js';

export class GridEvolution {
    constructor(canvasId, config = {}) {
        this.canvasId = canvasId;
        this.config = config;
        this.isInitialized = false;
        this.debugMode = config.debugMode || true;

        // Log initialization attempt
        this.log('GridEvolution constructor called with canvas ID:', canvasId);

        // Initialize sub-systems
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
                    this.uiController.showError('Could not initialize grid visualization. Please try refreshing the page.');
                }
            });

        } catch (error) {
            this.logError('Critical error during initialization:', error);
            if (this.uiController) {
                this.uiController.showError('Critical error during initialization. Please try refreshing the page.');
            }
        }
    }

    tryInitializeDirect() {
        try {
            // Find canvas element
            const canvas = document.getElementById(this.canvasId);
            if (!canvas) {
                this.log('Canvas element not found:', this.canvasId);
                return false;
            }

            this.log('Canvas element found:', canvas);

            // Initialize core components
            this.initializeComponents(canvas);

            // Set up event handlers
            this.setupEventHandlers();

            // Calculate initial energy/cost
            this.calculateInitialState();

            return true;

        } catch (error) {
            this.logError('Error in tryInitializeDirect:', error);
            return false;
        }
    }

    initializeComponents(canvas) {
        // Initialize grid core
        this.gridCore = new GridCore(this.config.gridSize || 32, this.config);

        // Initialize renderer
        this.renderer = new GridRenderer(canvas, this.gridCore.gridSize, {
            cellSize: this.config.cellSize || 20,
            padding: this.config.padding || 10,
            debugMode: this.debugMode
        });

        // Initialize energy system
        this.energySystem = new EnhancedEnergySystem(this.gridCore.gridSize, {
            debugMode: this.debugMode
        });

        // Initialize evolution engine
        this.evolutionEngine = new EvolutionEngine(this.gridCore.gridSize, {
            ...this.config,
            debugMode: this.debugMode
        });

        // Initialize UI controller
        this.uiController = new UIController({
            debugMode: this.debugMode
        });

        this.log('All components initialized successfully');
    }

    setupEventHandlers() {
        // Canvas click handler
        this.uiController.bindCanvasClickHandler(this.renderer.canvas, (e) => {
            this.handleCanvasClick(e);
        });

        // UI event handlers
        this.uiController.bindEventHandlers({
            onStart: () => this.startEvolution(),
            onPause: () => this.stopEvolution(),
            onStep: () => this.evolveStep(),
            onReset: () => this.reset(),
            onRandomize: () => this.randomize(),
            onGridSizeChange: (newSize) => this.resizeGrid(newSize),
            onSpeedChange: (speed) => this.setEvolutionSpeed(speed),
            onEvolutionMethodChange: (useAnnealing) => this.setEvolutionMethod(useAnnealing),
            onTemperatureChange: (value) => this.setAnnealingParameter('temperature', value),
            onCoolingRateChange: (value) => this.setAnnealingParameter('coolingRate', value),
            onAreaPreservationChange: (checked) => this.setAreaPreservation(checked),
            onEdgeWeightChange: (value) => this.setCostWeight('edgeSharpness', value),
            onCornerWeightChange: (value) => this.setCostWeight('cornerPenalty', value),
            onPatternWeightChange: (value) => this.setCostWeight('patternPenalty', value),
            onZebraWeightChange: (value) => this.setCostWeight('zebraPatterns', value),
            onMaxStepsChange: (value) => this.setMaxSteps(value),
            onPresetChange: (preset) => this.applyPreset(preset)
        });

        // Update UI with current values
        this.updateUIFromConfig();

        this.log('Event handlers set up successfully');
    }

    calculateInitialState() {
        // Calculate initial energy/cost with enhanced energy system
        const initialEnergy = this.energySystem.calculateEnergy(
            this.gridCore.grid,
            this.gridCore.totalArea,
            this.gridCore.targetArea,
            this.gridCore.STATES
        );

        if (this.evolutionEngine.useSimulatedAnnealing) {
            this.evolutionEngine.initializeSimulatedAnnealing(
                this.energySystem,
                this.gridCore.grid,
                this.gridCore.totalArea,
                this.gridCore.targetArea,
                this.gridCore.STATES
            );
            this.evolutionEngine.currentEnergy = initialEnergy;
            this.evolutionEngine.currentCost = initialEnergy;
        } else {
            this.evolutionEngine.currentCost = initialEnergy;
        }

        // Initialize cost history
        this.evolutionEngine.costHistory = [initialEnergy];

        this.log('Initial state calculated with enhanced energy system - Energy:', initialEnergy.toFixed(3));
    }

    completeInitialization() {
        try {
            this.log('Completing initialization...');

            // Force initial render
            this.render();
            this.updateUI();

            // Set initial status
            this.updateStatus('Ready');

            // Hide loading indicator
            this.uiController.hideLoadingIndicator();

            this.log('Initialization completed successfully!', 'success');
            this.log('Initial state - Area:', this.gridCore.totalArea.toFixed(1),
                     'Target:', this.gridCore.targetArea,
                     'Energy:', this.evolutionEngine.currentEnergy?.toFixed(3) || 'N/A',
                     'Cost:', this.evolutionEngine.currentCost.toFixed(3));

        } catch (error) {
            this.logError('Error completing initialization:', error);
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

    // Core grid operations
    handleCanvasClick(e) {
        this.log('Canvas clicked');
        const rect = this.renderer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - this.renderer.padding;
        const y = e.clientY - rect.top - this.renderer.padding;

        const result = this.renderer.getCellFromCanvasPosition(x, y);
        this.log('Click coordinates:', { x, y, ...result });

        if (result.valid) {
            this.log('Valid cell clicked, toggling...');
            this.toggleCell(result.row, result.col);
            this.render();
        } else {
            this.log('Click outside grid area');
        }
    }

    toggleCell(row, col) {
        const change = this.gridCore.toggleCell(row, col);
        this.log('Cell toggled:', change);
        return change;
    }

    // Evolution control methods
    startEvolution() {
        this.evolutionEngine.startEvolution();
        this.evolveLoop();
    }

    stopEvolution() {
        this.evolutionEngine.stopEvolution();
    }

    evolveLoop() {
        this.log('evolveLoop() called, isRunning:', this.evolutionEngine.isRunning);
        if (this.evolutionEngine.isRunning) {
            this.evolveStep();
            setTimeout(() => this.evolveLoop(), this.evolutionEngine.evolutionSpeed);
        }
    }

    evolveStep() {
        this.log('evolveStep() called, isRunning:', this.evolutionEngine.isRunning);
        if (!this.evolutionEngine.isRunning) return;

        let shouldRender = false;

        if (this.evolutionEngine.useSimulatedAnnealing) {
            // Simulated annealing step
            const result = this.evolutionEngine.annealingStep(this.gridCore, this.energySystem, this.gridCore.STATES);

            // Cool down temperature
            this.evolutionEngine.coolTemperature();

            // Update cost history
            this.evolutionEngine.costHistory.push(this.evolutionEngine.currentEnergy);
            if (this.evolutionEngine.costHistory.length > 1000) {
                this.evolutionEngine.costHistory.shift();
            }

            shouldRender = result.accepted;

            // Check termination conditions
            if (this.evolutionEngine.shouldTerminateAnnealing()) {
                this.stopEvolution();
                shouldRender = true; // Final render
            }
        } else {
            // Greedy optimization step
            const result = this.evolutionEngine.greedyStep(this.gridCore, this.gridCore.STATES);
            shouldRender = result.applied;

            // Update cost
            this.evolutionEngine.currentCost = this.energySystem.calculateEnergy(
                this.gridCore.grid,
                this.gridCore.totalArea,
                this.gridCore.targetArea,
                this.gridCore.STATES
            );
            this.evolutionEngine.costHistory.push(this.evolutionEngine.currentCost);

            // Check termination conditions
            if (this.evolutionEngine.shouldTerminateGreedy()) {
                this.stopEvolution();
                shouldRender = true; // Final render
            }
        }

        this.evolutionEngine.currentStep++;

        // Periodic visual updates
        if (!shouldRender && (this.evolutionEngine.currentStep % 10 === 0)) {
            shouldRender = true;
        }

        if (shouldRender) {
            this.render();
        }

        // Always update UI
        this.updateUI();
    }

    // Grid management methods
    reset() {
        this.log('reset() called');
        this.stopEvolution();
        this.evolutionEngine.reset();
        this.gridCore.reset();
        this.calculateInitialState();
        this.render();
        this.updateUI();
    }

    randomize() {
        this.log('randomize() called');
        this.stopEvolution();
        this.evolutionEngine.reset();
        this.gridCore.randomize();
        this.calculateInitialState();
        this.render();
        this.updateUI();
    }

    resizeGrid(newSize) {
        this.log('resizeGrid called with:', newSize);
        this.stopEvolution();
        this.evolutionEngine.reset();

        // Resize components
        this.gridCore.resize(newSize);
        this.renderer.resize(newSize);
        this.energySystem.gridSize = newSize;
        this.evolutionEngine.gridSize = newSize;

        this.calculateInitialState();
        this.render();
        this.updateUI();
    }

    // Configuration methods
    setEvolutionMethod(useAnnealing) {
        this.evolutionEngine.setEvolutionMethod(useAnnealing);
        if (useAnnealing && !this.evolutionEngine.currentEnergy) {
            this.calculateInitialState();
        }
        this.updateUI();
    }

    setEvolutionSpeed(speed) {
        this.evolutionEngine.setEvolutionSpeed(speed);
        this.uiController.updateSpeedDisplay(speed);
    }

    setMaxSteps(maxSteps) {
        this.evolutionEngine.setMaxSteps(maxSteps);
        this.uiController.updateMaxStepsDisplay(maxSteps);
    }

    setCostWeight(type, value) {
        // Map old weight names to enhanced energy system weights
        const weightMapping = {
            'edgeSharpness': 'geometricContinuity',
            'cornerPenalty': 'sharpCorners',
            'patternPenalty': 'incompatibleConnections',
            'zebraPatterns': 'zebraPatterns'
        };

        const enhancedWeightType = weightMapping[type] || type;
        this.energySystem.setEnergyWeight(enhancedWeightType, value);

        // Recalculate current cost/energy
        if (this.evolutionEngine.useSimulatedAnnealing) {
            this.evolutionEngine.currentEnergy = this.energySystem.calculateEnergy(
                this.gridCore.grid,
                this.gridCore.totalArea,
                this.gridCore.targetArea,
                this.gridCore.STATES
            );
            this.evolutionEngine.currentCost = this.evolutionEngine.currentEnergy;
        } else {
            this.evolutionEngine.currentCost = this.energySystem.calculateEnergy(
                this.gridCore.grid,
                this.gridCore.totalArea,
                this.gridCore.targetArea,
                this.gridCore.STATES
            );
        }
        this.updateUI();
    }

    setEnergyWeight(type, value) {
        this.energySystem.setEnergyWeight(type, value);
        // Recalculate current energy
        this.evolutionEngine.currentEnergy = this.energySystem.calculateEnergy(
            this.gridCore.grid,
            this.gridCore.totalArea,
            this.gridCore.targetArea,
            this.gridCore.STATES
        );
        this.evolutionEngine.currentCost = this.evolutionEngine.currentEnergy;
        this.updateUI();
    }

    setAnnealingParameter(param, value) {
        this.evolutionEngine.setAnnealingParameter(param, value);
        this.updateUI();
    }

    resetTemperature() {
        this.evolutionEngine.resetTemperature();
        this.updateUI();
    }

    setAreaPreservation(preserve) {
        this.evolutionEngine.areaPreservation = preserve;
        // Recalculate current cost
        this.evolutionEngine.currentCost = this.energySystem.calculateEnergy(
            this.gridCore.grid,
            this.gridCore.totalArea,
            this.gridCore.targetArea,
            this.gridCore.STATES
        );
        this.updateUI();
    }

    // Preset patterns
    applyPreset(preset) {
        if (!preset) return;

        this.reset();

        switch(preset) {
            case 'smooth':
                this.createSmoothBlobPreset();
                break;
            case 'checkerboard':
                this.createCheckerboardPreset();
                break;
            case 'random':
                this.randomize();
                return; // randomize already handles everything
            case 'custom':
                // User can click to create custom pattern
                break;
        }

        this.calculateInitialState();
        this.render();
        this.updateUI();
    }

    createSmoothBlobPreset() {
        const center = Math.floor(this.gridCore.gridSize / 2);
        for (let row = center - 3; row <= center + 3; row++) {
            for (let col = center - 3; col <= center + 3; col++) {
                if (row >= 0 && row < this.gridCore.gridSize &&
                    col >= 0 && col < this.gridCore.gridSize) {
                    const distance = Math.sqrt((row - center) ** 2 + (col - center) ** 2);
                    if (distance < 3) {
                        this.gridCore.setCell(row, col, this.gridCore.STATES.FULL);
                    } else if (distance < 4) {
                        this.gridCore.setCell(row, col, this.gridCore.STATES.HALF_DIAG_TL_BR);
                    }
                }
            }
        }
    }

    createCheckerboardPreset() {
        for (let row = 0; row < this.gridCore.gridSize; row++) {
            for (let col = 0; col < this.gridCore.gridSize; col++) {
                if ((row + col) % 2 === 0) {
                    this.gridCore.setCell(row, col, this.gridCore.STATES.FULL);
                }
            }
        }
    }

    // Rendering and UI methods
    render() {
        if (!this.isInitialized) {
            this.log('render() called but not initialized');
            return;
        }

        this.renderer.render(this.gridCore.grid, this.gridCore.STATES);
    }

    updateUI() {
        const data = {
            step: this.evolutionEngine.currentStep,
            isRunning: this.evolutionEngine.isRunning,
            currentArea: this.gridCore.totalArea,
            targetArea: this.gridCore.targetArea,
            speed: this.evolutionEngine.evolutionSpeed,
            showAnnealingControls: this.evolutionEngine.useSimulatedAnnealing,
            maxSteps: this.evolutionEngine.maxSteps
        };

        if (this.evolutionEngine.useSimulatedAnnealing) {
            data.energy = this.evolutionEngine.currentEnergy;
            data.temperature = this.evolutionEngine.temperature;
            data.coolingRate = this.evolutionEngine.coolingRate;
            data.isAnnealing = true;
        } else {
            data.cost = this.evolutionEngine.currentCost;
            data.isAnnealing = false;
        }

        data.status = data.isRunning ? 'Running' : 'Stopped';

        this.uiController.updateUI(data);
    }

    updateUIFromConfig() {
        // Update UI controls to match current configuration
        this.uiController.updateUI({
            speed: this.evolutionEngine.evolutionSpeed,
            temperature: this.evolutionEngine.temperature,
            coolingRate: this.evolutionEngine.coolingRate,
            maxSteps: this.evolutionEngine.maxSteps,
            weights: this.evolutionEngine.costWeights,
            showAnnealingControls: this.evolutionEngine.useSimulatedAnnealing
        });
    }

    updateStatus(status) {
        this.uiController.updateStatus(status, this.evolutionEngine.useSimulatedAnnealing, this.evolutionEngine.temperature);
    }

    // Public API methods for external access
    getGridStats() {
        return this.gridCore.getGridStats();
    }

    getCurrentEnergy() {
        return this.evolutionEngine.currentEnergy || 0;
    }

    getCurrentCost() {
        return this.evolutionEngine.currentCost || 0;
    }

    getTemperature() {
        return this.evolutionEngine.getCurrentTemperature();
    }

    getCostHistory() {
        return [...this.evolutionEngine.costHistory];
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