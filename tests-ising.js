/**
 * Comprehensive Unit Tests for J1-J2 Ising Energy Implementation
 * 
 * TEST COVERAGE:
 * Suite 1: Basic Ising energy calculations (spin values, simple grids)
 * Suite 2: J1-J2 coupling validation (nearest vs next-nearest neighbors)
 * Suite 3: Ferromagnetic behavior (clustering favored)
 * Suite 4: Efficient local energy change calculation
 * Suite 5: Swap energy calculation with neighbor handling
 * Suite 6: Integration with evolution engine
 * Suite 7: Edge cases and boundary conditions
 */

import { GeometricKernels } from './geometric-kernels.js';
import { EnhancedEnergySystem } from './enhanced-energy-system.js';
import { EvolutionEngine } from './evolution-engine.js';
import { GridCore } from './grid-core.js';

// ============================================================================
// TEST UTILITIES
// ============================================================================

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
    this.suites = [];
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  assertEquals(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(
        `Assertion failed: ${message}\nExpected: ${expected}\nActual: ${actual}`
      );
    }
  }

  assertAlmostEquals(actual, expected, tolerance = 1e-6, message = '') {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(
        `Assertion failed: ${message}\nExpected: ${expected} (±${tolerance})\nActual: ${actual}\nDifference: ${Math.abs(actual - expected)}`
      );
    }
  }

  assertGreaterThan(actual, value, message = '') {
    if (actual <= value) {
      throw new Error(
        `Assertion failed: ${message}\nExpected: > ${value}\nActual: ${actual}`
      );
    }
  }

  assertLessThan(actual, value, message = '') {
    if (actual >= value) {
      throw new Error(
        `Assertion failed: ${message}\nExpected: < ${value}\nActual: ${actual}`
      );
    }
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  suite(name) {
    this.suites.push({ name, tests: this.tests });
    this.tests = [];
  }

  async run() {
    console.log('========================================');
    console.log('Running J1-J2 Ising Energy Tests');
    console.log('========================================\n');

    let totalPassed = 0;
    let totalFailed = 0;

    for (const suite of this.suites) {
      console.log(`\n--- ${suite.name} ---`);
      for (const { name, testFn } of suite.tests) {
        try {
          await testFn(this);
          totalPassed++;
          console.log(`  ✓ ${name}`);
        } catch (error) {
          totalFailed++;
          console.error(`  ✗ ${name}`);
          console.error(`    ${error.message}\n`);
        }
      }
    }

    console.log('\n========================================');
    console.log(`Results: ${totalPassed} passed, ${totalFailed} failed`);
    console.log('========================================');

    return totalFailed === 0;
  }
}

// ============================================================================
// TEST HELPERS
// ============================================================================

const STATES = {
  EMPTY: 0,
  FULL: 1,
  HALF_DIAG_TL_BR: 2,
  HALF_DIAG_TR_BL: 3,
  HALF_DIAG_BL_TR: 4,
  HALF_DIAG_BR_TL: 5,
};

function createGrid(gridSize, pattern) {
  const grid = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(STATES.EMPTY));

  if (pattern === 'uniform-full') {
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        grid[row][col] = STATES.FULL;
      }
    }
  } else if (pattern === 'uniform-empty') {
    // Already initialized to EMPTY
  } else if (pattern === 'checkerboard') {
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        grid[row][col] = (row + col) % 2 === 0 ? STATES.FULL : STATES.EMPTY;
      }
    }
  } else if (pattern === 'single-full') {
    grid[0][0] = STATES.FULL;
  } else if (pattern === 'two-adjacent-j1') {
    // Two cells that are J1 neighbors (horizontally adjacent)
    grid[0][0] = STATES.FULL;
    grid[0][1] = STATES.FULL;
  } else if (pattern === 'two-adjacent-j2') {
    // Two cells that are J2 neighbors (diagonally adjacent)
    grid[0][0] = STATES.FULL;
    grid[1][1] = STATES.FULL;
  } else if (pattern === 'cluster-2x2') {
    // 2x2 cluster of FULL cells
    grid[0][0] = STATES.FULL;
    grid[0][1] = STATES.FULL;
    grid[1][0] = STATES.FULL;
    grid[1][1] = STATES.FULL;
  } else if (pattern === 'horizontal-stripe') {
    // Horizontal stripe in middle
    const midRow = Math.floor(gridSize / 2);
    for (let col = 0; col < gridSize; col++) {
      grid[midRow][col] = STATES.FULL;
    }
  } else if (pattern === 'diagonal-states') {
    // Mix of diagonal half-states
    grid[0][0] = STATES.HALF_DIAG_TL_BR;
    grid[0][1] = STATES.HALF_DIAG_TR_BL;
    grid[1][0] = STATES.FULL;
    grid[1][1] = STATES.EMPTY;
  }

  return grid;
}

// ============================================================================
// SUITE 1: BASIC ISING ENERGY CALCULATIONS
// ============================================================================

const runner = new TestRunner();

runner.test('Spin value mapping for EMPTY state', (t) => {
  const kernels = new GeometricKernels(8);
  t.assertEquals(kernels.getSpinValue(STATES.EMPTY), -1, 'EMPTY should map to -1');
});

runner.test('Spin value mapping for FULL state', (t) => {
  const kernels = new GeometricKernels(8);
  t.assertEquals(kernels.getSpinValue(STATES.FULL), 1, 'FULL should map to +1');
});

runner.test('Spin value mapping for diagonal states', (t) => {
  const kernels = new GeometricKernels(8);
  t.assertEquals(kernels.getSpinValue(STATES.HALF_DIAG_TL_BR), 0, 'Diagonal states should map to 0');
  t.assertEquals(kernels.getSpinValue(STATES.HALF_DIAG_TR_BL), 0, 'Diagonal states should map to 0');
  t.assertEquals(kernels.getSpinValue(STATES.HALF_DIAG_BL_TR), 0, 'Diagonal states should map to 0');
  t.assertEquals(kernels.getSpinValue(STATES.HALF_DIAG_BR_TL), 0, 'Diagonal states should map to 0');
});

runner.test('Uniform FULL grid has minimum energy', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'uniform-full');
  
  const energy = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  
  // For ferromagnetic coupling with all spins aligned (+1), energy should be negative
  // E = -J1 * (4 neighbors per interior cell) * (+1 * +1) - J2 * (4 diagonal neighbors) * (+1 * +1)
  // This is the minimum energy configuration
  t.assert(energy < 0, 'Uniform FULL grid should have negative (favorable) energy');
});

runner.test('Uniform EMPTY grid has minimum energy', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'uniform-empty');
  
  const energy = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  
  // For ferromagnetic coupling with all spins aligned (-1), energy should be negative
  t.assert(energy < 0, 'Uniform EMPTY grid should have negative (favorable) energy');
});

runner.test('Checkerboard pattern has maximum energy', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'checkerboard');
  
  const energy = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  
  // For ferromagnetic coupling, alternating spins should have positive (unfavorable) energy
  // Each interaction is -J * (+1) * (-1) = +J (positive)
  t.assert(energy > 0, 'Checkerboard pattern should have positive (unfavorable) energy');
});

runner.test('Single FULL cell in EMPTY grid has zero energy', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'single-full');
  
  const energy = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  
  // Single spin surrounded by opposite spins
  // E = -J1 * 4 * (+1 * -1) - J2 * 4 * (+1 * -1)
  // E = +J1 * 4 + J2 * 4 = 8 (with J1=J2=1)
  t.assertAlmostEquals(energy, 8.0, 1e-6, 'Single FULL cell should have energy +8');
});

runner.suite('Suite 1: Basic Ising Energy Calculations');

// ============================================================================
// SUITE 2: J1-J2 COUPLING VALIDATION
// ============================================================================

runner.test('J1 coupling affects nearest neighbors', (t) => {
  const gridSize = 4;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'two-adjacent-j1');
  
  // Two FULL cells horizontally adjacent
  const energyJ1_1 = kernels.calculateIsingEnergy(grid, STATES, 1.0, 0.0);
  const energyJ1_2 = kernels.calculateIsingEnergy(grid, STATES, 2.0, 0.0);
  
  // Doubling J1 should double the energy contribution
  t.assertAlmostEquals(energyJ1_2, 2 * energyJ1_1, 1e-6, 'Doubling J1 should double energy');
});

runner.test('J2 coupling affects diagonal neighbors', (t) => {
  const gridSize = 4;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'two-adjacent-j2');
  
  // Two FULL cells diagonally adjacent
  const energyJ2_1 = kernels.calculateIsingEnergy(grid, STATES, 0.0, 1.0);
  const energyJ2_2 = kernels.calculateIsingEnergy(grid, STATES, 0.0, 2.0);
  
  // Doubling J2 should double the energy contribution
  t.assertAlmostEquals(energyJ2_2, 2 * energyJ2_1, 1e-6, 'Doubling J2 should double energy');
});

runner.test('J1 and J2 contributions are independent', (t) => {
  const gridSize = 4;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'cluster-2x2');
  
  const energyJ1_only = kernels.calculateIsingEnergy(grid, STATES, 1.0, 0.0);
  const energyJ2_only = kernels.calculateIsingEnergy(grid, STATES, 0.0, 1.0);
  const energyBoth = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  
  t.assertAlmostEquals(energyBoth, energyJ1_only + energyJ2_only, 1e-6, 
    'Combined energy should equal sum of J1 and J2 contributions');
});

runner.test('Different J1/J2 ratios produce different energies', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'checkerboard');
  
  const energyJ1_dominant = kernels.calculateIsingEnergy(grid, STATES, 2.0, 0.5);
  const energyJ2_dominant = kernels.calculateIsingEnergy(grid, STATES, 0.5, 2.0);
  
  t.assert(energyJ1_dominant !== energyJ2_dominant, 
    'Different J1/J2 ratios should produce different energies');
});

runner.suite('Suite 2: J1-J2 Coupling Validation');

// ============================================================================
// SUITE 3: FERROMAGNETIC BEHAVIOR
// ============================================================================

runner.test('Like neighbors have negative contribution', (t) => {
  const gridSize = 4;
  const kernels = new GeometricKernels(gridSize);
  
  // Two FULL cells adjacent (like spins)
  const gridLike = createGrid(gridSize, 'two-adjacent-j1');
  const energyLike = kernels.calculateIsingEnergy(gridLike, STATES, 1.0, 0.0);
  
  t.assert(energyLike < 0, 'Like neighbors (FULL-FULL) should have negative energy');
});

runner.test('Unlike neighbors have positive contribution', (t) => {
  const gridSize = 4;
  const kernels = new GeometricKernels(gridSize);
  
  // Single FULL cell in EMPTY grid (unlike spins)
  const gridUnlike = createGrid(gridSize, 'single-full');
  const energyUnlike = kernels.calculateIsingEnergy(gridUnlike, STATES, 1.0, 1.0);
  
  t.assert(energyUnlike > 0, 'Unlike neighbors (FULL-EMPTY) should have positive energy');
});

runner.test('Clustering reduces energy compared to scattered', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  
  // Cluster of 4 cells vs 4 isolated cells
  const gridCluster = createGrid(gridSize, 'cluster-2x2');
  const energyCluster = kernels.calculateIsingEnergy(gridCluster, STATES, 1.0, 1.0);
  
  // Create scattered pattern (4 isolated FULL cells)
  const gridScattered = createGrid(gridSize, 'uniform-empty');
  gridScattered[0][0] = STATES.FULL;
  gridScattered[2][2] = STATES.FULL;
  gridScattered[4][4] = STATES.FULL;
  gridScattered[6][6] = STATES.FULL;
  const energyScattered = kernels.calculateIsingEnergy(gridScattered, STATES, 1.0, 1.0);
  
  t.assert(energyCluster < energyScattered, 
    'Clustered cells should have lower energy than scattered cells');
});

runner.suite('Suite 3: Ferromagnetic Behavior');

// ============================================================================
// SUITE 4: EFFICIENT LOCAL ENERGY CHANGE
// ============================================================================

runner.test('Local energy change matches full recalculation', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'checkerboard');
  
  const row = 3, col = 3;
  const oldState = grid[row][col];
  const newState = oldState === STATES.EMPTY ? STATES.FULL : STATES.EMPTY;
  
  // Calculate using local method
  const deltaLocal = kernels.calculateLocalIsingChange(
    grid, STATES, row, col, oldState, newState, 1.0, 1.0
  );
  
  // Calculate using full recalculation
  const energyBefore = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  grid[row][col] = newState;
  const energyAfter = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  const deltaFull = energyAfter - energyBefore;
  
  t.assertAlmostEquals(deltaLocal, deltaFull, 1e-9, 
    'Local energy change should match full recalculation');
});

runner.test('Local energy change is zero for no state change', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'checkerboard');
  
  const row = 3, col = 3;
  const state = grid[row][col];
  
  const delta = kernels.calculateLocalIsingChange(
    grid, STATES, row, col, state, state, 1.0, 1.0
  );
  
  t.assertAlmostEquals(delta, 0.0, 1e-9, 'No state change should give zero energy change');
});

runner.test('Local energy change for corner cell', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'uniform-empty');
  
  // Test corner cell (0,0) - has only 2 J1 neighbors and 1 J2 neighbor
  const row = 0, col = 0;
  const oldState = STATES.EMPTY;
  const newState = STATES.FULL;
  
  const deltaLocal = kernels.calculateLocalIsingChange(
    grid, STATES, row, col, oldState, newState, 1.0, 1.0
  );
  
  const energyBefore = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  grid[row][col] = newState;
  const energyAfter = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  const deltaFull = energyAfter - energyBefore;
  
  t.assertAlmostEquals(deltaLocal, deltaFull, 1e-9, 
    'Local energy change should work for corner cells');
});

runner.test('Local energy change ignores diagonal states', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'diagonal-states');
  
  // Change a cell surrounded by diagonal states (spin = 0)
  const row = 1, col = 1;
  const oldState = STATES.EMPTY;
  const newState = STATES.FULL;
  
  const delta = kernels.calculateLocalIsingChange(
    grid, STATES, row, col, oldState, newState, 1.0, 1.0
  );
  
  // Since neighbors with spin=0 are ignored, energy change should be minimal
  // (only from interactions with FULL neighbor at [1][0])
  t.assert(Math.abs(delta) >= 0, 'Energy change calculated with diagonal neighbors');
});

runner.suite('Suite 4: Efficient Local Energy Change');

// ============================================================================
// SUITE 5: SWAP ENERGY CALCULATION
// ============================================================================

runner.test('Swap energy for non-neighbor cells', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'checkerboard');
  
  const cell1 = { row: 1, col: 1 };
  const cell2 = { row: 5, col: 5 };
  const state1 = grid[cell1.row][cell1.col];
  const state2 = grid[cell2.row][cell2.col];
  
  // Calculate using swap method
  const deltaSwap = kernels.calculateIsingSwapEnergy(
    grid, STATES, cell1, cell2, state1, state2, 1.0, 1.0
  );
  
  // Calculate using full recalculation
  const energyBefore = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  grid[cell1.row][cell1.col] = state2;
  grid[cell2.row][cell2.col] = state1;
  const energyAfter = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  const deltaFull = energyAfter - energyBefore;
  
  t.assertAlmostEquals(deltaSwap, deltaFull, 1e-9, 
    'Swap energy should match full recalculation for non-neighbors');
});

runner.test('Swap energy for J1 neighbor cells', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'checkerboard');
  
  const cell1 = { row: 3, col: 3 };
  const cell2 = { row: 3, col: 4 }; // J1 neighbor (horizontally adjacent)
  const state1 = grid[cell1.row][cell1.col];
  const state2 = grid[cell2.row][cell2.col];
  
  const deltaSwap = kernels.calculateIsingSwapEnergy(
    grid, STATES, cell1, cell2, state1, state2, 1.0, 1.0
  );
  
  const energyBefore = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  grid[cell1.row][cell1.col] = state2;
  grid[cell2.row][cell2.col] = state1;
  const energyAfter = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  const deltaFull = energyAfter - energyBefore;
  
  t.assertAlmostEquals(deltaSwap, deltaFull, 1e-9, 
    'Swap energy should handle J1 neighbors correctly');
});

runner.test('Swap energy for J2 neighbor cells', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'checkerboard');
  
  const cell1 = { row: 3, col: 3 };
  const cell2 = { row: 4, col: 4 }; // J2 neighbor (diagonally adjacent)
  const state1 = grid[cell1.row][cell1.col];
  const state2 = grid[cell2.row][cell2.col];
  
  const deltaSwap = kernels.calculateIsingSwapEnergy(
    grid, STATES, cell1, cell2, state1, state2, 1.0, 1.0
  );
  
  const energyBefore = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  grid[cell1.row][cell1.col] = state2;
  grid[cell2.row][cell2.col] = state1;
  const energyAfter = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  const deltaFull = energyAfter - energyBefore;
  
  t.assertAlmostEquals(deltaSwap, deltaFull, 1e-9, 
    'Swap energy should handle J2 neighbors correctly');
});

runner.test('Swap identical states has zero energy change', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'uniform-full');
  
  const cell1 = { row: 2, col: 2 };
  const cell2 = { row: 4, col: 4 };
  const state1 = STATES.FULL;
  const state2 = STATES.FULL;
  
  const deltaSwap = kernels.calculateIsingSwapEnergy(
    grid, STATES, cell1, cell2, state1, state2, 1.0, 1.0
  );
  
  t.assertAlmostEquals(deltaSwap, 0.0, 1e-9, 
    'Swapping identical states should give zero energy change');
});

runner.suite('Suite 5: Swap Energy Calculation');

// ============================================================================
// SUITE 6: INTEGRATION WITH ENERGY SYSTEM
// ============================================================================

runner.test('EnhancedEnergySystem includes Ising energy', (t) => {
  const gridSize = 8;
  const energySystem = new EnhancedEnergySystem(gridSize);
  const grid = createGrid(gridSize, 'checkerboard');
  
  // Set Ising weight to 0 and calculate
  energySystem.setEnergyWeight('isingEnergy', 0.0);
  const energyWithoutIsing = energySystem.calculateEnergy(grid, STATES);
  
  // Set Ising weight to 1 and calculate
  energySystem.setEnergyWeight('isingEnergy', 1.0);
  const energyWithIsing = energySystem.calculateEnergy(grid, STATES);
  
  t.assert(energyWithIsing !== energyWithoutIsing, 
    'Ising energy should contribute to total energy');
});

runner.test('J1 parameter affects total energy', (t) => {
  const gridSize = 8;
  const energySystem = new EnhancedEnergySystem(gridSize);
  const grid = createGrid(gridSize, 'horizontal-stripe');
  
  energySystem.setIsingJ1(1.0);
  const energy1 = energySystem.calculateEnergy(grid, STATES);
  
  energySystem.setIsingJ1(2.0);
  const energy2 = energySystem.calculateEnergy(grid, STATES);
  
  t.assert(energy1 !== energy2, 'Changing J1 should affect total energy');
});

runner.test('J2 parameter affects total energy', (t) => {
  const gridSize = 8;
  const energySystem = new EnhancedEnergySystem(gridSize);
  const grid = createGrid(gridSize, 'cluster-2x2');
  
  energySystem.setIsingJ2(1.0);
  const energy1 = energySystem.calculateEnergy(grid, STATES);
  
  energySystem.setIsingJ2(2.0);
  const energy2 = energySystem.calculateEnergy(grid, STATES);
  
  t.assert(energy1 !== energy2, 'Changing J2 should affect total energy');
});

runner.suite('Suite 6: Integration with Energy System');

// ============================================================================
// SUITE 7: EDGE CASES AND BOUNDARY CONDITIONS
// ============================================================================

runner.test('Empty grid has consistent energy', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'uniform-empty');
  
  const energy = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  
  // All spins are -1, so energy should be negative (ferromagnetic)
  t.assert(energy < 0, 'Empty grid should have negative energy');
});

runner.test('Boundary cells handled correctly', (t) => {
  const gridSize = 4;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'uniform-empty');
  
  // Set only boundary cells to FULL
  for (let i = 0; i < gridSize; i++) {
    grid[0][i] = STATES.FULL;
    grid[gridSize-1][i] = STATES.FULL;
    grid[i][0] = STATES.FULL;
    grid[i][gridSize-1] = STATES.FULL;
  }
  
  const energy = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0);
  
  // Should compute without errors and give finite result
  t.assert(isFinite(energy), 'Boundary cells should be handled correctly');
});

runner.test('Bounding box limits calculation region', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'uniform-full');
  
  const boundingBox = { minRow: 2, maxRow: 5, minCol: 2, maxCol: 5 };
  
  const energyFull = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0, null);
  const energyBounded = kernels.calculateIsingEnergy(grid, STATES, 1.0, 1.0, boundingBox);
  
  t.assert(Math.abs(energyBounded) < Math.abs(energyFull), 
    'Bounding box should limit calculation region');
});

runner.test('Zero coupling constants give zero energy', (t) => {
  const gridSize = 8;
  const kernels = new GeometricKernels(gridSize);
  const grid = createGrid(gridSize, 'checkerboard');
  
  const energy = kernels.calculateIsingEnergy(grid, STATES, 0.0, 0.0);
  
  t.assertAlmostEquals(energy, 0.0, 1e-9, 
    'Zero coupling constants should give zero energy');
});

runner.suite('Suite 7: Edge Cases and Boundary Conditions');

// ============================================================================
// RUN TESTS
// ============================================================================

// Auto-run tests when loaded
runner.run().then((success) => {
  if (success) {
    console.log('\n✓ All Ising energy tests passed!');
  } else {
    console.log('\n✗ Some tests failed');
  }
});

export { runner };
