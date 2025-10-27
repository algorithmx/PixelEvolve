// Grid Evolution - Main orchestrator class
// This is the new, refactored version of the GridEvolution class

import { GridCore } from "./grid-core.js";
import { GridRenderer } from "./grid-renderer.js";
import { EnhancedEnergySystem } from "./enhanced-energy-system.js";
import { EvolutionEngine } from "./evolution-engine.js";
import { UIController } from "./ui-controller.js";
import { SimulationStatus } from "./simulation-status.js";

export class GridEvolution {
  constructor(canvasId, config = {}) {
    this.canvasId = canvasId;
    this.config = config;
    this.isInitialized = false;
    this.debugMode = config.debugMode || true;

    // Log initialization attempt
    this.log("GridEvolution constructor called with canvas ID:", canvasId);

    // Initialize sub-systems
    this.initializeWithFallback();
  }

  initializeWithFallback() {
    try {
      // Method 1: Direct initialization
      if (this.tryInitializeDirect()) {
        this.log("Direct initialization successful");
        this.isInitialized = true;
        this.completeInitialization();
        return;
      }

      // Method 2: Wait for DOM ready
      this.log("Direct initialization failed, waiting for DOM...");
      this.waitForDOM(() => {
        if (this.tryInitializeDirect()) {
          this.log("DOM-ready initialization successful");
          this.isInitialized = true;
          this.completeInitialization();
        } else {
          this.logError("All initialization methods failed");
          this.uiController.showError(
            "Could not initialize grid visualization. Please try refreshing the page.",
          );
        }
      });
    } catch (error) {
      this.logError("Critical error during initialization:", error);
      if (this.uiController) {
        this.uiController.showError(
          "Critical error during initialization. Please try refreshing the page.",
        );
      }
    }
  }

  tryInitializeDirect() {
    try {
      // Find canvas element
      const canvas = document.getElementById(this.canvasId);
      if (!canvas) {
        this.log("Canvas element not found:", this.canvasId);
        return false;
      }

      this.log("Canvas element found:", canvas);

      // Initialize core components
      this.initializeComponents(canvas);

      // Set up event handlers
      this.setupEventHandlers();

      // Calculate initial energy/cost
      this.calculateInitialState();

      return true;
    } catch (error) {
      this.logError("Error in tryInitializeDirect:", error);
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
      debugMode: this.debugMode,
    });

    // Initialize energy system
    this.energySystem = new EnhancedEnergySystem(this.gridCore.gridSize, {
      debugMode: this.debugMode,
    });

    // Initialize evolution engine
    this.evolutionEngine = new EvolutionEngine(this.gridCore.gridSize, {
      ...this.config,
      debugMode: this.debugMode,
    });

    // Initialize UI controller
    this.uiController = new UIController({
      debugMode: this.debugMode,
    });

    this.log("All components initialized successfully");
  }

  setupEventHandlers() {
    // UI event handlers
    this.uiController.bindEventHandlers({
      onStart: () => this.startEvolution(),
      onPause: () => this.pauseEvolution(),
      onResume: () => this.resumeEvolution(),
      onStep: () => this.evolveStep(),
      onReset: () => this.reset(),
      onRandomize: () => this.randomize(),
      onGridSizeChange: (newSize) => this.resizeGrid(newSize),
      onSpeedChange: (speed) => this.setEvolutionSpeed(speed),
      onTemperatureChange: (value) =>
        this.setAnnealingParameter("temperature", value),
      onCoolingRateChange: (value) =>
        this.setAnnealingParameter("coolingRate", value),
      onAreaPreservationChange: (checked) => this.setAreaPreservation(checked),
      onEdgeWeightChange: (value) =>
        this.setEnergyWeight("geometricContinuity", value),
      onCornerWeightChange: (value) =>
        this.setEnergyWeight("sharpCorners", value),
      onZebraWeightChange: (value) =>
        this.setEnergyWeight("zebraPatterns", value),
      onHoleIsolationWeightChange: (value) =>
        this.setEnergyWeight("holesAndIsolation", value),
      onMaxStepsChange: (value) => this.setMaxSteps(value),
      onPresetChange: (preset) => this.applyPreset(preset),
    });

    // Update UI with current values
    this.updateUIFromConfig();

    this.log("Event handlers set up successfully");
  }

  calculateInitialState() {
    // Calculate initial energy/cost with enhanced energy system
    const initialEnergy = this.energySystem.calculateEnergy(
      this.gridCore.grid,
      this.gridCore.STATES,
    );

    // Initialize simulated annealing
    this.evolutionEngine.initializeSimulatedAnnealing(
      this.energySystem,
      this.gridCore.grid,
      this.gridCore.totalArea,
      this.gridCore.targetArea,
      this.gridCore.STATES,
    );
    this.evolutionEngine.currentEnergy = initialEnergy;
    this.evolutionEngine.currentCost = initialEnergy;

    // Initialize cost history
    this.evolutionEngine.costHistory = [initialEnergy];

    this.log(
      "Initial state calculated with enhanced energy system - Energy:",
      initialEnergy.toFixed(3),
    );
  }

  completeInitialization() {
    try {
      this.log("Completing initialization...");

      // Force initial render
      this.render();
      this.updateUI();

      // Set up drag-and-drop rectangle drawing as additional feature
      this.setupDragRectangle();

      // Set initial status
      SimulationStatus.setStatus(SimulationStatus.STATUS.IDLE);
      this.updateStatus("Ready");

      // Hide loading indicator
      this.uiController.hideLoadingIndicator();

      this.log("Initialization completed successfully!", "success");
      this.log(
        "Initial state - Area:",
        this.gridCore.totalArea.toFixed(1),
        "Target:",
        this.gridCore.targetArea,
        "Energy:",
        this.evolutionEngine.currentEnergy?.toFixed(3) || "N/A",
        "Cost:",
        this.evolutionEngine.currentCost.toFixed(3),
      );
    } catch (error) {
      this.logError("Error completing initialization:", error);
    }
  }

  waitForDOM(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      // DOM is already ready
      setTimeout(callback, 0);
    }
  }

  // Core grid operations

  toggleCell(row, col) {
    const change = this.gridCore.toggleCell(row, col);
    this.log("Cell toggled:", change);
    return change;
  }

  // Input handling methods - now handled by UI Controller drag rectangle system

  // Evolution control methods
  startEvolution() {
    this.log("startEvolution() called");

    // Reset evolution state if starting fresh
    if (SimulationStatus.isStopped() || SimulationStatus.isIdle()) {
      this.evolutionEngine.reset();
      this.calculateInitialState();
    }

    SimulationStatus.setStatus(SimulationStatus.STATUS.RUNNING);
    this.evolutionEngine.startEvolution();
    this.evolveLoop();
  }

  pauseEvolution() {
    this.log("pauseEvolution() called");
    SimulationStatus.setStatus(SimulationStatus.STATUS.PAUSED);
    this.evolutionEngine.stopEvolution();
  }

  resumeEvolution() {
    this.log("resumeEvolution() called");

    if (SimulationStatus.isPaused()) {
      SimulationStatus.setStatus(SimulationStatus.STATUS.RUNNING);
      this.evolutionEngine.startEvolution();
      this.evolveLoop();
    } else {
      this.logWarning("resumeEvolution() called but simulation is not paused");
    }
  }

  stopEvolution() {
    this.log("stopEvolution() called");
    SimulationStatus.setStatus(SimulationStatus.STATUS.STOPPED);
    this.evolutionEngine.stopEvolution();
  }

  evolveLoop() {
    this.log(
      "evolveLoop() called, isRunning:",
      this.evolutionEngine.isRunning,
      "status:",
      SimulationStatus.getStatus(),
    );

    // Continue only if engine is running AND status is RUNNING
    if (this.evolutionEngine.isRunning && SimulationStatus.isRunning()) {
      this.evolveStep();
      setTimeout(() => this.evolveLoop(), this.evolutionEngine.evolutionSpeed);
    } else {
      // Update status if engine stopped but global status is still running
      if (SimulationStatus.isRunning() && !this.evolutionEngine.isRunning) {
        SimulationStatus.setStatus(SimulationStatus.STATUS.PAUSED);
      }
    }
  }

  evolveStep() {
    this.log("evolveStep() called, isRunning:", this.evolutionEngine.isRunning);
    if (!this.evolutionEngine.isRunning) return;

    let shouldRender = false;

    // Simulated annealing step
    const result = this.evolutionEngine.annealingStep(
      this.gridCore,
      this.energySystem,
      this.gridCore.STATES,
    );

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

    this.evolutionEngine.currentStep++;

    // Periodic visual updates
    if (!shouldRender && this.evolutionEngine.currentStep % 10 === 0) {
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
    this.log("reset() called");
    this.stopEvolution();
    this.evolutionEngine.reset();
    this.gridCore.reset();
    this.calculateInitialState();
    SimulationStatus.setStatus(SimulationStatus.STATUS.IDLE);
    this.render();
    this.updateUI();
  }

  randomize() {
    this.log("randomize() called");
    this.stopEvolution();
    this.evolutionEngine.reset();
    this.gridCore.randomize();
    this.calculateInitialState();
    SimulationStatus.setStatus(SimulationStatus.STATUS.IDLE);
    this.render();
    this.updateUI();
  }

  resizeGrid(newSize) {
    this.log("resizeGrid called with:", newSize);
    this.stopEvolution();
    this.evolutionEngine.reset();

    // Resize components
    this.gridCore.resize(newSize);
    this.renderer.resize(newSize);
    this.energySystem.gridSize = newSize;
    this.energySystem.geometricKernels.updateGridSize(newSize);
    this.evolutionEngine.gridSize = newSize;

    // Rebind drag rectangle handler for new grid size
    this.setupDragRectangle();

    this.calculateInitialState();
    this.render();
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

  setEnergyWeight(type, value) {
    this.energySystem.setEnergyWeight(type, value);
    // Recalculate current energy
    this.evolutionEngine.currentEnergy = this.energySystem.calculateEnergy(
      this.gridCore.grid,
      this.gridCore.STATES,
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
      this.gridCore.STATES,
    );
    this.updateUI();
  }

  // Preset patterns
  applyPreset(preset) {
    if (!preset) return;

    this.reset();

    switch (preset) {
      case "smooth":
        this.createSmoothBlobPreset();
        break;
      case "checkerboard":
        this.createCheckerboardPreset();
        break;
      case "random":
        this.randomize();
        return; // randomize already handles everything
      case "custom":
        // User can click to create custom pattern
        break;
    }

    this.calculateInitialState();
    this.render();
    this.updateUI();
  }

  createSmoothBlobPreset() {
    const gridSize = this.gridCore.gridSize;
    const center = Math.floor(gridSize / 2);

    // Scale the blob size based on grid size
    // Smaller grids get smaller relative blobs, larger grids get larger blobs
    const scaleFactor = Math.max(0.15, Math.min(0.35, gridSize / 100));
    const coreRadius = Math.max(2, Math.floor(gridSize * scaleFactor));
    const outerRadius = Math.max(3, Math.floor(gridSize * (scaleFactor + 0.1)));

    for (let row = center - outerRadius; row <= center + outerRadius; row++) {
      for (let col = center - outerRadius; col <= center + outerRadius; col++) {
        if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
          const distance = Math.sqrt((row - center) ** 2 + (col - center) ** 2);
          if (distance < coreRadius) {
            this.gridCore.setCell(row, col, this.gridCore.STATES.FULL);
          } else if (distance < outerRadius) {
            // CURRENT CODE (comment out):
            // this.gridCore.setCell(row, col, this.gridCore.STATES.HALF_DIAG_TL_BR);

            // DESIRED CODE:
            // Use FULL states instead of diagonal to avoid half-filled grids
            this.gridCore.setCell(row, col, this.gridCore.STATES.FULL);
          }
        }
      }
    }
  }

  createCheckerboardPreset() {
    const gridSize = this.gridCore.gridSize;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const position = (row + col) % 2;

        if (position === 0) {
          // Set full cells on even positions
          this.gridCore.setCell(row, col, this.gridCore.STATES.FULL);
        } else {
          // CURRENT CODE (comment out):
          // // Add diagonal states on odd positions to create more interesting patterns
          // // Vary the diagonal state based on position to create diverse patterns
          // const diagonalType = (row * gridSize + col) % 4;
          // const diagonalState = [
          //     this.gridCore.STATES.HALF_DIAG_TL_BR,
          //     this.gridCore.STATES.HALF_DIAG_TR_BL,
          //     this.gridCore.STATES.HALF_DIAG_BL_TR,
          //     this.gridCore.STATES.HALF_DIAG_BR_TL
          // ][diagonalType];
          // this.gridCore.setCell(row, col, diagonalState);

          // DESIRED CODE:
          // Use FULL states instead of diagonal states to maintain consistency
          this.gridCore.setCell(row, col, this.gridCore.STATES.FULL);
        }
      }
    }
  }

  // Rendering and UI methods
  render() {
    if (!this.isInitialized) {
      this.log("render() called but not initialized");
      return;
    }

    // Update grid reference for drag rectangle preview
    this.uiController.setGridReference(
      this.gridCore.grid,
      this.gridCore.STATES,
    );

    this.renderer.render(this.gridCore.grid, this.gridCore.STATES);
  }

  updateUI() {
    const data = {
      step: this.evolutionEngine.currentStep,
      isRunning: this.evolutionEngine.isRunning,
      currentArea: this.gridCore.totalArea,
      targetArea: this.gridCore.targetArea,
      speed: this.evolutionEngine.evolutionSpeed,
      showAnnealingControls: true,
      maxSteps: this.evolutionEngine.maxSteps,
    };

    data.energy = this.evolutionEngine.currentEnergy;
    data.temperature = this.evolutionEngine.temperature;
    data.coolingRate = this.evolutionEngine.coolingRate;
    data.isAnnealing = true;

    // Add current energy weights
    const weights = this.energySystem.getEnergyWeights();
    data.edgeWeight = weights.geometricContinuity;
    data.cornerWeight = weights.sharpCorners;
    data.zebraWeight = weights.zebraPatterns;
    data.holeIsolationWeight = weights.holesAndIsolation;

    data.status = data.isRunning ? "Running" : "Stopped";

    this.uiController.updateUI(data);
  }

  updateUIFromConfig() {
    // Update UI controls to match current configuration
    const weights = this.energySystem.getEnergyWeights();
    this.uiController.updateUI({
      speed: this.evolutionEngine.evolutionSpeed,
      temperature: this.evolutionEngine.temperature,
      coolingRate: this.evolutionEngine.coolingRate,
      maxSteps: this.evolutionEngine.maxSteps,
      showAnnealingControls: true,
      edgeWeight: weights.geometricContinuity,
      cornerWeight: weights.sharpCorners,
      zebraWeight: weights.zebraPatterns,
      holeIsolationWeight: weights.holesAndIsolation,
    });
  }

  updateStatus(status) {
    this.uiController.updateStatus(
      status,
      true,
      this.evolutionEngine.temperature,
    );
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

  getCurrentStep() {
    return this.evolutionEngine.currentStep;
  }

  // Set up drag-and-drop rectangle drawing as additional feature
  setupDragRectangle() {
    // Set grid reference for drag preview
    this.uiController.setGridReference(
      this.gridCore.grid,
      this.gridCore.STATES,
    );

    // Bind drag rectangle handler
    this.uiController.bindDragRectangleHandler(
      this.renderer.canvas,
      this.renderer,
      this.gridCore,
      (row, col, height, width) => {
        this.log(
          `Rectangle drawn: start(${row},${col}) size(${height}x${width})`,
        );

        // Recalculate energy after rectangle drawing
        this.evolutionEngine.currentEnergy = this.energySystem.calculateEnergy(
          this.gridCore.grid,
          this.gridCore.STATES,
        );
        this.evolutionEngine.currentCost = this.evolutionEngine.currentEnergy;

        // Update UI
        this.updateUI();
      },
    );
  }

  // Cleanup method
  destroy() {
    this.stopEvolution();

    this.log("GridEvolution destroyed");
  }

  // Logging methods
  log(...args) {
    if (this.debugMode) {
      console.log("[GridEvolution]", ...args);
    }
  }

  logError(...args) {
    console.error("[GridEvolution ERROR]", ...args);
  }

  logWarning(...args) {
    console.warn("[GridEvolution WARNING]", ...args);
  }
}
