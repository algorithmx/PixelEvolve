// Evolution Engine - Evolution algorithms (simulated annealing)

export class EvolutionEngine {
  constructor(gridSize, config = {}) {
    this.gridSize = gridSize;
    this.config = config;
    this.debugMode = config.debugMode || false;

    // Evolution parameters
    this.isRunning = false;
    this.currentStep = 0;
    this.maxSteps = config.maxSteps || 1000;
    this.evolutionSpeed = config.evolutionSpeed || 2;
    this.areaPreservation = config.areaPreservation !== false;

    // Simulated annealing parameters
    this.temperature = 1.0;
    this.initialTemperature = 1.0;
    this.coolingRate = config.coolingRate || 0.995;
    this.minTemperature = config.minTemperature || 0.001;

    // Evolution state
    this.currentEnergy = 0;
    this.currentCost = 0;
    this.costHistory = [];

    this.log("Evolution engine initialized");
  }

  // Initialize simulated annealing
  initializeSimulatedAnnealing(energySystem, grid, states) {
    if (!energySystem) {
      throw new Error("EnergySystem required for simulated annealing");
    }

    // Set initial temperature based on current energy
    this.currentEnergy = energySystem.calculateEnergy(grid, states);
    this.initialTemperature = Math.max(0.1, this.currentEnergy * 0.5);
    this.temperature = this.initialTemperature;

    this.log(
      "Simulated annealing initialized with temperature:",
      this.temperature,
    );
  }

  // Single step of simulated annealing evolution with area-preserving swaps
  annealingStep(gridCore, energySystem, states) {
    if (!energySystem) {
      throw new Error("EnergySystem required for annealing step");
    }

    // Area-preserving evolution: swap two cells with different states
    const swapResult = this.proposeAreaPreservingSwap(gridCore);

    if (!swapResult) {
      return { accepted: false };
    }

    const { cell1, cell2, state1, state2 } = swapResult;

    // Calculate energy difference for the swap
    const deltaEnergy = this.calculateSwapEnergyDifference(
      gridCore.grid,
      energySystem,
      cell1,
      cell2,
      state1,
      state2,
      states,
    );

    // Metropolis acceptance criterion
    let acceptChange = false;

    if (deltaEnergy < 0) {
      // Energy decreases - always accept
      acceptChange = true;
    } else {
      // Energy increases - accept with probability
      const probability = Math.exp(-deltaEnergy / this.temperature);
      acceptChange = Math.random() < probability;
    }

    // Apply swap if accepted
    if (acceptChange) {
      // Apply the swap
      gridCore.setCell(cell1.row, cell1.col, state2);
      gridCore.setCell(cell2.row, cell2.col, state1);

      this.currentEnergy += deltaEnergy;
      this.log(
        `Annealing: accepted swap (${cell1.row},${cell1.col})↔(${cell2.row},${cell2.col}), ΔE=${deltaEnergy.toFixed(3)}, T=${this.temperature.toFixed(4)}`,
      );
      return {
        accepted: true,
        swap: true,
        cell1,
        cell2,
        oldStates: { state1, state2 },
        newStates: { state1: state2, state2: state1 },
        deltaEnergy,
      };
    }

    return { accepted: false };
  }

  // Propose an area-preserving swap between two cells with different states
  proposeAreaPreservingSwap(gridCore) {
    // Use precomputed state inventories from GridCore (O(1) access)
    const stateInventories = gridCore.computeStateInventories();

    // Get all non-empty states that have cells available for swapping
    const availableStates = Object.keys(stateInventories).filter(
      state => state !== '0' && stateInventories[state].count > 0
    );

    // If no non-empty states exist, or no empty states, cannot perform area-preserving swap
    if (availableStates.length === 0 || stateInventories['0'].count === 0) {
      return null;
    }

    // Choose a random non-empty state to swap with empty cells
    const selectedState = availableStates[Math.floor(Math.random() * availableStates.length)];

    // Use reservoir sampling for memory-efficient unbiased selection
    const emptyCell = this.selectRandomCellFromState(0, stateInventories['0'], gridCore);
    const occupiedCell = this.selectRandomCellFromState(parseInt(selectedState), stateInventories[selectedState], gridCore);

    if (!emptyCell || !occupiedCell) {
      return null;
    }

    return {
      cell1: emptyCell,
      cell2: occupiedCell,
      state1: emptyCell.state,
      state2: occupiedCell.state,
    };
  }

  
  // Select a random cell from a given state using reservoir sampling
  selectRandomCellFromState(state, stateInventory, gridCore) {
    const totalCells = this.gridSize * this.gridSize;
    // stateInventory already contains the specific state data we need
    if (stateInventory.count === 0) {
      return null;
    }

    // For smaller grids or when state is rare, use complete scan
    if (totalCells <= 2500 || stateInventory.count < totalCells * 0.05) {
      const candidates = [];
      for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
          if (gridCore.grid[row][col] === state) {
            candidates.push({ row, col, state });
          }
        }
      }

      if (candidates.length === 0) {
        return null;
      }

      // Fisher-Yates shuffle for unbiased selection
      const randomIndex = Math.floor(Math.random() * candidates.length);
      return candidates[randomIndex];
    }

    // For larger grids with common states, use reservoir sampling
    let selectedCell = null;
    let itemCount = 0;

    // Random traversal order to avoid bias
    const rows = Array.from({length: this.gridSize}, (_, i) => i);
    const cols = Array.from({length: this.gridSize}, (_, i) => i);

    // Shuffle rows and columns for unbiased traversal
    for (let i = rows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    for (let i = cols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cols[i], cols[j]] = [cols[j], cols[i]];
    }

    // Reservoir sampling: sample the first k items, then replace with decreasing probability
    const reservoirSize = Math.min(100, Math.ceil(Math.sqrt(stateInventory.count)));
    const reservoir = [];

    for (const row of rows) {
      for (const col of cols) {
        if (gridCore.grid[row][col] === state) {
          itemCount++;

          if (reservoir.length < reservoirSize) {
            reservoir.push({ row, col, state });
          } else {
            // Replace random item in reservoir with probability 1/k
            const replaceIndex = Math.floor(Math.random() * itemCount);
            if (replaceIndex < reservoirSize) {
              reservoir[replaceIndex] = { row, col, state };
            }
          }
        }
      }
    }

    if (reservoir.length === 0) {
      return null;
    }

    // Select uniformly from reservoir
    const randomIndex = Math.floor(Math.random() * reservoir.length);
    return reservoir[randomIndex];
  }

  // Calculate energy difference for a swap operation - optimized to use only affected area
  calculateSwapEnergyDifference(
    grid,
    energySystem,
    cell1,
    cell2,
    state1,
    state2,
    states,
  ) {
    // Maximum kernel radius is 2 (for 5x5 kernels), so affected area is radius 2 around both cells
    const affectedRadius = 2;

    // Calculate combined affected region for both swapped cells
    const minRow = Math.max(0, Math.min(cell1.row, cell2.row) - affectedRadius);
    const maxRow = Math.min(
      this.gridSize - 1,
      Math.max(cell1.row, cell2.row) + affectedRadius,
    );
    const minCol = Math.max(0, Math.min(cell1.col, cell2.col) - affectedRadius);
    const maxCol = Math.min(
      this.gridSize - 1,
      Math.max(cell1.col, cell2.col) + affectedRadius,
    );

    // Create bounding box for the affected region
    const boundingBox = { minRow, maxRow, minCol, maxCol };

    // Create temporary grid with the swap applied (only needed for energy calculation)
    const tempGrid = grid.map((r) => [...r]);
    tempGrid[cell1.row][cell1.col] = state2;
    tempGrid[cell2.row][cell2.col] = state1;

    // Calculate energy using optimized region-based approach with bounding boxes
    const oldEnergy = energySystem.geometricKernels.calculateGeometricEnergy(
      grid,
      states,
      {
        corners: energySystem.energyWeights.sharpCorners,
        continuity: energySystem.energyWeights.geometricContinuity,
        zebra: energySystem.energyWeights.zebraPatterns,
      },
      boundingBox
    );

    const newEnergy = energySystem.geometricKernels.calculateGeometricEnergy(
      tempGrid,
      states,
      {
        corners: energySystem.energyWeights.sharpCorners,
        continuity: energySystem.energyWeights.geometricContinuity,
        zebra: energySystem.energyWeights.zebraPatterns,
      },
      boundingBox
    );

    return newEnergy - oldEnergy;
  }

  // Temperature cooling schedule
  coolTemperature() {
    // Exponential cooling
    this.temperature *= this.coolingRate;

    // Ensure minimum temperature
    if (this.temperature < this.minTemperature) {
      this.temperature = this.minTemperature;
    }

    // Adaptive cooling based on acceptance rate
    if (this.currentStep > 0 && this.currentStep % 100 === 0) {
      const recentAcceptanceRate = this.calculateRecentAcceptanceRate();
      if (recentAcceptanceRate < 0.2) {
        // Too few acceptances - heat up slightly
        this.temperature *= 1.1;
      } else if (recentAcceptanceRate > 0.8) {
        // Too many acceptances - cool faster
        this.temperature *= 0.95;
      }
    }
  }

  // Calculate recent acceptance rate (simple version)
  calculateRecentAcceptanceRate() {
    // For now, return a reasonable estimate
    // In a full implementation, you'd track actual acceptance history
    return 0.4; // Placeholder
  }

  // Check if annealing should terminate
  shouldTerminateAnnealing() {
    // Temperature too low
    if (this.temperature <= this.minTemperature) {
      this.log("Annealing terminated: minimum temperature reached");
      return true;
    }

    // Energy converged
    if (this.costHistory.length > 50) {
      const recentEnergies = this.costHistory.slice(-20);
      const maxEnergy = Math.max(...recentEnergies);
      const minEnergy = Math.min(...recentEnergies);
      const energyRange = maxEnergy - minEnergy;

      if (energyRange < 0.001) {
        this.log("Annealing terminated: energy converged");
        return true;
      }
    }

    // Maximum steps
    if (this.currentStep >= this.maxSteps) {
      this.log("Annealing terminated: maximum steps reached");
      return true;
    }

    return false;
  }

  // Start evolution
  startEvolution() {
    this.log("startEvolution() called");
    this.isRunning = true;
  }

  // Stop evolution
  stopEvolution() {
    this.log("stopEvolution() called");
    this.isRunning = false;
  }

  // Reset evolution state
  reset() {
    this.currentStep = 0;
    this.currentEnergy = 0;
    this.currentCost = 0;
    this.costHistory = [];
    this.temperature = this.initialTemperature;
  }

  setEvolutionSpeed(speed) {
    this.evolutionSpeed = speed;
  }

  setMaxSteps(maxSteps) {
    this.maxSteps = maxSteps;
  }

  setAnnealingParameter(param, value) {
    switch (param) {
      case "temperature":
        this.temperature = value;
        this.initialTemperature = value;
        break;
      case "coolingRate":
        this.coolingRate = value;
        break;
      case "minTemperature":
        this.minTemperature = value;
        break;
    }
    this.log(`Annealing parameter ${param} set to ${value}`);
  }

  resetTemperature() {
    this.temperature = this.initialTemperature;
    this.log("Temperature reset to initial value:", this.temperature);
  }

  getCurrentTemperature() {
    return this.temperature || 0;
  }

  log(...args) {
    if (this.debugMode) {
      console.log("[EvolutionEngine]", ...args);
    }
  }
}
