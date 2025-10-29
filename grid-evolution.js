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

    // Debug levels: 0=off, 1=essential, 2=important, 3=detailed, 4=verbose
    this.debugLevel = config.debugLevel !== undefined ? config.debugLevel : 2;
    this.debugMode = this.debugLevel > 0;

    // Log initialization attempt
    this.logVerbose("GridEvolution constructor called with canvas ID:", canvasId);

    // Initialize sub-systems
    this.initializeWithFallback();
  }

  initializeWithFallback() {
    try {
      // Method 1: Direct initialization
      if (this.tryInitializeDirect()) {
        this.logImportant("Direct initialization successful");
        this.isInitialized = true;
        this.completeInitialization();
        return;
      }

      // Method 2: Wait for DOM ready
      this.logDetailed("Direct initialization failed, waiting for DOM...");
      this.waitForDOM(() => {
        if (this.tryInitializeDirect()) {
          this.logImportant("DOM-ready initialization successful");
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
        this.logDetailed("Canvas element not found:", this.canvasId);
        return false;
      }

      this.logVerbose("Canvas element found:", canvas);

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
    // Provide non-uniform grid points to renderer
    this.renderer.setGridPoints(this.gridCore.xPoints, this.gridCore.yPoints);

    // Initialize energy system
    this.energySystem = new EnhancedEnergySystem(this.gridCore.gridSize, {
      debugMode: this.debugMode,
    });

    // Initialize UI controller first to get UI values
    this.uiController = new UIController({
      debugMode: this.debugMode,
    });

    // Get UI values to use as single source of truth
    const uiValues = this.uiController.getUIValues();

    // Initialize evolution engine with UI temperature as single source of truth
    this.evolutionEngine = new EvolutionEngine(this.gridCore.gridSize, {
      ...this.config,
      temperature: uiValues.temperature,
      coolingRate: uiValues.coolingRate,
      maxSteps: uiValues.maxSteps,
      debugMode: this.debugMode,
    });

    this.logImportant("All components initialized with UI temperature:", uiValues.temperature);
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
      onNeighborWeightChange: (value) =>
        this.setEnergyWeight("neighborEnergy", value),
      onHoleIsolationWeightChange: (value) =>
        this.setEnergyWeight("holesAndIsolation", value),
      onIsingWeightChange: (value) =>
        this.setEnergyWeight("isingEnergy", value),
      onIsingJ1Change: (value) =>
        this.setIsingJ1(value),
      onIsingJ2Change: (value) =>
        this.setIsingJ2(value),
      onMaxStepsChange: (value) => this.setMaxSteps(value),
      onPresetChange: (preset) => this.applyPreset(preset),
      onSnapshot: () => this.takeSnapshot(),
      // Non-uniform grid: apply and randomize
      onGridPointsApply: ({ xPoints, yPoints }) => this.applyGridPoints(xPoints, yPoints),
      onGridPointsRandom: (jitter) => this.randomizeGridPoints(jitter),
      onGridPointsUniform: () => this.setUniformGridPoints(),
      // Boundary markers
      onMarkersApply: (spec) => this.applyBoundaryMarkers(spec),
      onMarkersClear: () => this.clearBoundaryMarkers(),
    });

    // Update UI with current values
    this.updateUIFromConfig();

    this.logDetailed("Event handlers set up successfully");
  }

  calculateInitialState() {
    // Calculate initial energy/cost with enhanced energy system
    const initialEnergy = this.energySystem.calculateEnergy(
      this.gridCore.grid,
      this.gridCore.STATES,
    );

    // Initialize simulated annealing with UI temperature as single source of truth
    const uiValues = this.uiController.getUIValues();
    this.evolutionEngine.initializeSimulatedAnnealing(
      this.energySystem,
      this.gridCore.grid,
      this.gridCore.STATES,
      uiValues.temperature,
    );
    this.evolutionEngine.currentEnergy = initialEnergy;
    this.evolutionEngine.currentCost = initialEnergy;

    // Initialize cost history
    this.evolutionEngine.costHistory = [initialEnergy];

    this.logImportant(
      "Initial state calculated - Energy:",
      initialEnergy.toFixed(3),
    );
  }

  completeInitialization() {
    try {
      this.logDetailed("Completing initialization...");

      // Force initial render
      this.render();
      this.updateUI();

      // Set up drag-and-drop rectangle drawing as additional feature
      this.setupDragRectangle();

  // Set up click-to-toggle cell drawing (unmodified clicks)
  this.setupClickToggle();

      // Set initial status
      SimulationStatus.setStatus(SimulationStatus.STATUS.IDLE);
      this.updateStatus("Ready");

      // Hide loading indicator
      this.uiController.hideLoadingIndicator();

      this.logImportant("Initialization completed!");
      this.logImportant(
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
    this.logVerbose("Cell toggled:", change);
    return change;
  }

  // Input handling methods - now handled by UI Controller drag rectangle system

  // Evolution control methods
  startEvolution() {
    this.logImportant("Starting evolution");

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
    this.logImportant("Evolution paused");
    SimulationStatus.setStatus(SimulationStatus.STATUS.PAUSED);
    this.evolutionEngine.stopEvolution();
  }

  resumeEvolution() {
    this.logImportant("Evolution resumed");

    if (SimulationStatus.isPaused()) {
      SimulationStatus.setStatus(SimulationStatus.STATUS.RUNNING);
      this.evolutionEngine.startEvolution();
      this.evolveLoop();
    } else {
      this.logWarning("resumeEvolution() called but simulation is not paused");
    }
  }

  stopEvolution() {
    this.logImportant("Evolution stopped");
    SimulationStatus.setStatus(SimulationStatus.STATUS.STOPPED);
    this.evolutionEngine.stopEvolution();
  }

  evolveLoop() {
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
    this.logImportant("Grid reset");
    this.stopEvolution();
    this.evolutionEngine.reset();
    // Clear cells to an empty grid instead of generating an initial pattern
    if (typeof this.gridCore.clearGrid === 'function') {
      this.gridCore.clearGrid();
    } else {
      // Fallback to previous behavior if method not present
      this.gridCore.reset();
    }
    this.calculateInitialState();
    SimulationStatus.setStatus(SimulationStatus.STATUS.IDLE);
    this.render();
    this.updateUI();
  }

  randomize() {
    this.logImportant("Grid randomized");
    this.stopEvolution();
    this.evolutionEngine.reset();
    this.gridCore.randomize();
    this.calculateInitialState();
    SimulationStatus.setStatus(SimulationStatus.STATUS.IDLE);
    this.render();
    this.updateUI();
  }

  resizeGrid(newSize) {
    this.logImportant(`Grid resized to ${newSize}x${newSize}`);
    this.stopEvolution();
    this.evolutionEngine.reset();

    // Resize components
    this.gridCore.resize(newSize);
    this.renderer.resize(newSize);
  // Update renderer with (re)initialized points
  this.renderer.setGridPoints(this.gridCore.xPoints, this.gridCore.yPoints);
    this.energySystem.gridSize = newSize;
    this.energySystem.geometricKernels.updateGridSize(newSize);
    this.evolutionEngine.gridSize = newSize;

    // Rebind drag rectangle handler for new grid size
    this.setupDragRectangle();

    this.calculateInitialState();
    this.render();
    this.updateUI();
  }

  // Non-uniform grid API
  applyGridPoints(xPoints, yPoints) {
    const ok = this.gridCore.setGridPointsNormalized(xPoints, yPoints);
    if (!ok) {
      this.uiController.showMessage('Invalid grid points. Provide either N widths or N+1 boundaries in [0,1].', 'error');
      return;
    }
    this.renderer.setGridPoints(this.gridCore.xPoints, this.gridCore.yPoints);
    this.render();
    this.updateUI();
    this.uiController.showMessage('Applied non-uniform grid points.', 'success');
  }

  randomizeGridPoints(jitter = 0.35) {
    this.gridCore.xPoints = GridCore.generateRandomPoints(this.gridCore.gridSize, jitter);
    this.gridCore.yPoints = GridCore.generateRandomPoints(this.gridCore.gridSize, jitter);
    this.renderer.setGridPoints(this.gridCore.xPoints, this.gridCore.yPoints);
    this.render();
    this.updateUI();
    this.uiController.showMessage('Randomized non-uniform grid points.', 'success');
  }

  setUniformGridPoints() {
    this.gridCore.xPoints = GridCore.generateUniformPoints(this.gridCore.gridSize);
    this.gridCore.yPoints = GridCore.generateUniformPoints(this.gridCore.gridSize);
    this.renderer.setGridPoints(this.gridCore.xPoints, this.gridCore.yPoints);
    this.render();
    this.updateUI();
    this.uiController.showMessage('Switched to uniform grid points.', 'success');
  }

  // Boundary markers API
  applyBoundaryMarkers(spec) {
    const result = this.gridCore.setBoundaryMarkers(spec);
    if (!result.ok) {
      this.uiController.showMessage(`Markers applied with ${result.errors.length} issue(s): ${result.errors[0]}`, 'error');
    } else {
      this.uiController.showMessage('Markers applied.', 'success');
    }
    this.render();
  }

  clearBoundaryMarkers() {
    this.gridCore.clearBoundaryMarkers();
    this.uiController.showMessage('Markers cleared.', 'success');
    this.render();
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

  // Set Ising coupling constants
  setIsingJ1(value) {
    this.energySystem.setIsingJ1(value);
    this.uiController.updateIsingJ1Display(value);
    // Recalculate current energy
    this.evolutionEngine.currentEnergy = this.energySystem.calculateEnergy(
      this.gridCore.grid,
      this.gridCore.STATES,
    );
    this.evolutionEngine.currentCost = this.evolutionEngine.currentEnergy;
    this.updateUI();
    this.logDetailed(`Ising J1 coupling set to ${value}`);
  }

  setIsingJ2(value) {
    this.energySystem.setIsingJ2(value);
    this.uiController.updateIsingJ2Display(value);
    // Recalculate current energy
    this.evolutionEngine.currentEnergy = this.energySystem.calculateEnergy(
      this.gridCore.grid,
      this.gridCore.STATES,
    );
    this.evolutionEngine.currentCost = this.evolutionEngine.currentEnergy;
    this.updateUI();
    this.logDetailed(`Ising J2 coupling set to ${value}`);
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
      this.logVerbose("render() called but not initialized");
      return;
    }

    // Update grid reference for drag rectangle preview
    this.uiController.setGridReference(
      this.gridCore.grid,
      this.gridCore.STATES,
    );

    // Ensure renderer has latest markers before rendering
    this.renderer.setMarkers(this.gridCore.getBoundaryMarkers());
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
        this.logDetailed(
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

  // Set up click handler to toggle individual cells on normal click
  setupClickToggle() {
    const canvas = this.renderer?.canvas;
    if (!canvas) return;

    // Bind only once
    if (this._clickHandlerBound) return;
    this._clickHandlerBound = true;

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    this.uiController.bindCanvasClickHandler(canvas, (e) => {
      // If Ctrl is held, it's reserved for drag-rectangle; skip click toggle
      if (e.ctrlKey) return;

      const pos = getMousePos(e);
      const cell = this.renderer.getCellFromCanvasPosition(pos.x, pos.y);
      if (!cell.valid) return;

      // Toggle cell state
      this.toggleCell(cell.row, cell.col);

      // Recalculate energy/cost
      this.evolutionEngine.currentEnergy = this.energySystem.calculateEnergy(
        this.gridCore.grid,
        this.gridCore.STATES,
      );
      this.evolutionEngine.currentCost = this.evolutionEngine.currentEnergy;

      // Re-render and update UI
      this.render();
      this.updateUI();
    });
  }

  // Snapshot functionality - captures PNG image
  takeSnapshot() {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
      const baseFilename = `grid_snapshot_${dateStr}_${timeStr}`;

      // Save PNG image of the canvas
      this.saveCanvasAsPNG(baseFilename);

      // Also save a JSON snapshot including non-uniform grid points
      this.saveSnapshotJSON(baseFilename);

      this.logImportant(`PNG snapshot saved: ${baseFilename}.png`);
      this.uiController.showMessage(`Snapshot saved: ${baseFilename}.png and ${baseFilename}.json`, 'success');

    } catch (error) {
      this.logError('Error taking snapshot:', error);
      this.uiController.showMessage('Error saving snapshot. Check console for details.', 'error');
    }
  }

  // Save canvas as PNG image
  saveCanvasAsPNG(baseFilename) {
    const canvas = this.renderer.canvas;
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseFilename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  // Save grid configuration as JSON
  saveSnapshotJSON(baseFilename) {
    // Create snapshot object with comprehensive configuration
    const snapshot = {
      timestamp: new Date().toISOString(),
      gridSize: this.gridCore.gridSize,
      grid: this.gridCore.grid.map(row => [...row]), // Deep copy
      totalArea: this.gridCore.totalArea,
      targetArea: this.gridCore.targetArea,
      // Include non-uniform normalized grid points
      xPoints: Array.isArray(this.gridCore.xPoints) ? [...this.gridCore.xPoints] : null,
      yPoints: Array.isArray(this.gridCore.yPoints) ? [...this.gridCore.yPoints] : null,
      stats: {
        energy: this.evolutionEngine.currentEnergy || 0,
        cost: this.evolutionEngine.currentCost || 0,
        temperature: this.evolutionEngine.getCurrentTemperature(),
        step: this.evolutionEngine.currentStep,
      },
      parameters: {
        temperature: this.evolutionEngine.temperature,
        coolingRate: this.evolutionEngine.coolingRate,
        maxSteps: this.evolutionEngine.maxSteps,
      },
      energyWeights: {
        geometricContinuity: this.energySystem.energyWeights.geometricContinuity,
        sharpCorners: this.energySystem.energyWeights.sharpCorners,
        zebraPatterns: this.energySystem.energyWeights.zebraPatterns,
        neighborEnergy: this.energySystem.energyWeights.neighborEnergy,
        isingEnergy: this.energySystem.energyWeights.isingEnergy,
        isingJ1: this.energySystem.isingJ1,
        isingJ2: this.energySystem.isingJ2,
      },
    };

    // Convert to JSON string
    const jsonContent = JSON.stringify(snapshot, null, 2);

    // Create blob and download
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseFilename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Cleanup method
  destroy() {
    this.stopEvolution();

    this.logImportant("GridEvolution destroyed");
  }

  // Logging methods with levels
  log(level, ...args) {
    if (this.debugLevel >= level) {
      const levelNames = ['', 'ESSENTIAL', 'IMPORTANT', 'DETAILED', 'VERBOSE'];
      const prefix = levelNames[level] || 'INFO';
      console.log(`[GridEvolution ${prefix}]`, ...args);
    }
  }

  logError(...args) {
    console.error("[GridEvolution ERROR]", ...args);
  }

  logWarning(...args) {
    console.warn("[GridEvolution WARNING]", ...args);
  }

  // Convenience methods for different levels
  logEssential(...args) { this.log(1, ...args); }
  logImportant(...args) { this.log(2, ...args); }
  logDetailed(...args) { this.log(3, ...args); }
  logVerbose(...args) { this.log(4, ...args); }
}
