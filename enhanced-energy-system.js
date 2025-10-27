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
      neighborEnergy: 2.0, // Neighbor interaction energy (penalizes isolated cells)
      isingEnergy: 1.0, // J1-J2 Ising model energy (ferromagnetic coupling)
    };

    // Ising model coupling constants (independently tunable)
    this.isingJ1 = 1.0; // Nearest neighbor coupling (4-connected)
    this.isingJ2 = 1.0; // Next-nearest neighbor coupling (diagonal)

    // Initialize kernel system (now includes zebra patterns)
    this.geometricKernels = new GeometricKernels(gridSize);
    this.geometricKernels.debugMode = this.debugMode;

    this.log(
      "Enhanced energy system initialized with unified kernel-based detection (directional flow removed)",
    );
  }

  // Calculate total energy with comprehensive kernel-based detection (area constraint removed, no directional flow)
  calculateEnergy(grid, states) {
    // Full grid bounding box
    const fullGridBoundingBox = {
      minRow: 0,
      maxRow: this.gridSize - 1,
      minCol: 0,
      maxCol: this.gridSize - 1,
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
      fullGridBoundingBox,
    );

    // Calculate neighbor interaction energy (penalizes isolated cells, encourages clustering)
    const neighborInteractionEnergy =
      this.geometricKernels.calculateNeighborInteractionEnergy(
        grid,
        states,
        2.0, // scale parameter for exponential
        fullGridBoundingBox,
      );

    // Calculate Ising energy (J1-J2 ferromagnetic coupling)
    const isingEnergy = this.geometricKernels.calculateIsingEnergy(
      grid,
      states,
      this.isingJ1,
      this.isingJ2,
      fullGridBoundingBox,
    );

    // Combine energies with weights
    const totalEnergy =
      geometricEnergy +
      neighborInteractionEnergy * this.energyWeights.neighborEnergy +
      isingEnergy * this.energyWeights.isingEnergy;

    return totalEnergy;
  }

  // Helper methods
  isDiagonalState(state) {
    return state >= 2 && state <= 5;
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

  // Set Ising coupling constants (independently tunable)
  setIsingJ1(value) {
    this.isingJ1 = value;
    this.log(`Ising J1 coupling set to ${value}`);
  }

  setIsingJ2(value) {
    this.isingJ2 = value;
    this.log(`Ising J2 coupling set to ${value}`);
  }

  // Get Ising parameters
  getIsingJ1() {
    return this.isingJ1;
  }

  getIsingJ2() {
    return this.isingJ2;
  }

  log(...args) {
    if (this.debugMode) {
      console.log("[EnhancedEnergySystem]", ...args);
    }
  }
}
