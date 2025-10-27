// Enhanced Energy System - 6-State Aware Convolution Kernels

import { GeometricKernels } from "./geometric-kernels.js";

export class EnhancedEnergySystem {
  constructor(gridSize, config = {}) {
    this.gridSize = gridSize;
    this.config = config;
    this.debugMode = config.debugMode || false;

    // State definitions for reference
    this.STATES = {
      EMPTY: 0,
      FULL: 1,
      HALF_DIAG_TL_BR: 2, // Top-left to bottom-right
      HALF_DIAG_TR_BL: 3, // Top-right to bottom-left
      HALF_DIAG_BL_TR: 4, // Bottom-left to top-right
      HALF_DIAG_BR_TL: 5, // Bottom-right to top-left
    };

    // Energy weights for 6-state system - area constraint removed, no directional flow
    this.energyWeights = {
      geometricContinuity: 2.5, // Smooth geometric connections
      sharpCorners: 2.0, // Sharp geometric corners
      zebraPatterns: 2.5, // Kernel-based zebra pattern penalties
    };

    // Initialize kernel system (now includes zebra patterns)
    this.geometricKernels = new GeometricKernels(gridSize);
    this.geometricKernels.debugMode = this.debugMode;

    this.log(
      "Enhanced energy system initialized with unified kernel-based detection (directional flow removed)",
    );
  }

  // State compatibility matrix - how well different states connect
  getStateCompatibility(state1, state2) {
    // Returns compatibility score: 1.0 = perfect, 0.0 = incompatible
    if (state1 === state2) return 1.0;
    if (state1 === this.STATES.EMPTY || state2 === this.STATES.EMPTY)
      return 0.8;
    if (state1 === this.STATES.FULL || state2 === this.STATES.FULL) return 0.7;

    // Diagonal state compatibility - geometric reasoning
    const diagonalCompatibility = {
      [this.STATES.HALF_DIAG_TL_BR]: {
        [this.STATES.HALF_DIAG_TL_BR]: 1.0, // Same
        [this.STATES.HALF_DIAG_BR_TL]: 0.9, // Complementary
        [this.STATES.HALF_DIAG_TR_BL]: 0.1, // Conflicting
        [this.STATES.HALF_DIAG_BL_TR]: 0.1, // Conflicting
      },
      [this.STATES.HALF_DIAG_TR_BL]: {
        [this.STATES.HALF_DIAG_TR_BL]: 1.0, // Same
        [this.STATES.HALF_DIAG_BL_TR]: 0.9, // Complementary
        [this.STATES.HALF_DIAG_TL_BR]: 0.1, // Conflicting
        [this.STATES.HALF_DIAG_BR_TL]: 0.1, // Conflicting
      },
      [this.STATES.HALF_DIAG_BL_TR]: {
        [this.STATES.HALF_DIAG_BL_TR]: 1.0, // Same
        [this.STATES.HALF_DIAG_TR_BL]: 0.9, // Complementary
        [this.STATES.HALF_DIAG_TL_BR]: 0.1, // Conflicting
        [this.STATES.HALF_DIAG_BR_TL]: 0.1, // Conflicting
      },
      [this.STATES.HALF_DIAG_BR_TL]: {
        [this.STATES.HALF_DIAG_BR_TL]: 1.0, // Same
        [this.STATES.HALF_DIAG_TL_BR]: 0.9, // Complementary
        [this.STATES.HALF_DIAG_TR_BL]: 0.1, // Conflicting
        [this.STATES.HALF_DIAG_BL_TR]: 0.1, // Conflicting
      },
    };

    return diagonalCompatibility[state1]?.[state2] || 0.1;
  }

  // Calculate total energy with comprehensive kernel-based detection (area constraint removed, no directional flow)
  calculateEnergy(grid, states) {
    // Full grid bounding box
    const fullGridBoundingBox = {
      minRow: 0,
      maxRow: this.gridSize - 1,
      minCol: 0,
      maxCol: this.gridSize - 1
    };

    // Unified kernel-based geometric energy (corners, continuity, zebra patterns) - directional flow removed
    const geometricEnergy = this.geometricKernels.calculateGeometricEnergy(
      grid,
      states,
      {
        corners: this.energyWeights.sharpCorners,
        continuity: this.energyWeights.geometricContinuity,
        zebra: this.energyWeights.zebraPatterns,
      },
      fullGridBoundingBox
    );

    return geometricEnergy;
  }

  // Helper methods
  isDiagonalState(state) {
    return state >= 2 && state <= 5;
  }

  getNeighborStates(grid, row, col) {
    const neighbors = [];
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (
        newRow >= 0 &&
        newRow < this.gridSize &&
        newCol >= 0 &&
        newCol < this.gridSize
      ) {
        neighbors.push({
          row: newRow,
          col: newCol,
          state: grid[newRow][newCol],
        });
      }
    }

    return neighbors;
  }

  // Helper method for area contribution
  getAreaContribution(state, states) {
    switch (state) {
      case states.EMPTY:
        return 0;
      case states.FULL:
        return 1;
      default:
        return 0.5; // All half states
    }
  }

  // Set energy weights
  setEnergyWeight(type, value) {
    this.energyWeights[type] = value;
    this.log(`Energy weight ${type} set to ${value}`);
  }

  // Get energy weights
  getEnergyWeights() {
    return { ...this.energyWeights };
  }

  log(...args) {
    if (this.debugMode) {
      console.log("[EnhancedEnergySystem]", ...args);
    }
  }
}
