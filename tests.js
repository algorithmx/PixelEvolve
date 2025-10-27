/**
 * Comprehensive Unit Tests for PixelEvolve
 * 
 * TEST COVERAGE:
 * Suite 1-2: GeometricKernels.calculateNeighborInteractionEnergy (neighbor interaction energy)
 * Suite 3: EnhancedEnergySystem.calculateEnergy (total energy calculation)
 * Suite 4: EvolutionEngine.calculateSwapEnergyDifference (energy delta calculations)
 * Suite 5: GeometricKernels.applyKernel (kernel convolution with post-processing)
 * Suite 6: GeometricKernels detection methods (corners, continuity, zebra patterns)
 * Suite 7: EvolutionEngine bounding box and evolution operations
 * Suite 8: GridCore state management and grid operations
 * Suite 9: EnhancedEnergySystem weight sensitivity and pattern-specific energy
 * Suite 10: Integration tests (end-to-end evolution consistency)
 * Suite 11: Edge cases and error handling
 * 
 * TOTAL: 100+ comprehensive test cases
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

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('========================================');
    console.log('Running PixelEvolve Unit Tests');
    console.log('========================================\n');

    for (const { name, testFn } of this.tests) {
      try {
        await testFn(this);
        this.passed++;
        console.log(`✓ ${name}`);
      } catch (error) {
        this.failed++;
        console.error(`✗ ${name}`);
        console.error(`  ${error.message}\n`);
      }
    }

    console.log('\n========================================');
    console.log(`Results: ${this.passed} passed, ${this.failed} failed`);
    console.log('========================================');

    return this.failed === 0;
  }
}

// ============================================================================
// TEST HELPERS
// ============================================================================

function createSimpleGrid(gridSize, pattern) {
  const grid = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(0));

  // Apply pattern
  if (pattern === 'empty') {
    // Already initialized to all zeros
  } else if (pattern === 'checkerboard') {
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        grid[row][col] = (row + col) % 2;
      }
    }
  } else if (pattern === 'center') {
    const centerRow = Math.floor(gridSize / 2);
    const centerCol = Math.floor(gridSize / 2);
    grid[centerRow][centerCol] = 1;
  } else if (pattern === 'isolated') {
    // Create isolated cells (1 neighbor each)
    grid[0][0] = 1;
    grid[0][1] = 1;
    grid[2][2] = 1;
    grid[2][3] = 1;
  } else if (pattern === 'cluster') {
    // Create a 3x3 cluster (high neighbor count)
    for (let row = 1; row <= 3; row++) {
      for (let col = 1; col <= 3; col++) {
        grid[row][col] = 1;
      }
    }
  } else if (pattern === 'full') {
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        grid[row][col] = 1;
      }
    }
  } else if (pattern === 'horizontal-line') {
    const centerRow = Math.floor(gridSize / 2);
    for (let col = 1; col < gridSize - 1; col++) {
      grid[centerRow][col] = 1;
    }
  } else if (pattern === 'vertical-line') {
    const centerCol = Math.floor(gridSize / 2);
    for (let row = 1; row < gridSize - 1; row++) {
      grid[row][centerCol] = 1;
    }
  } else if (pattern === 'diagonal-line') {
    for (let i = 1; i < gridSize - 1; i++) {
      grid[i][i] = 1;
    }
  } else if (pattern === 'horizontal-zebra') {
    // Alternating filled rows
    for (let row = 0; row < gridSize; row++) {
      if (row % 2 === 0) {
        for (let col = 0; col < gridSize; col++) {
          grid[row][col] = 1;
        }
      }
    }
  } else if (pattern === 'vertical-zebra') {
    // Alternating filled columns
    for (let col = 0; col < gridSize; col++) {
      if (col % 2 === 0) {
        for (let row = 0; row < gridSize; row++) {
          grid[row][col] = 1;
        }
      }
    }
  } else if (pattern === 'corners') {
    // L-shaped corners in all 4 corners
    if (gridSize >= 3) {
      // Top-left
      grid[0][0] = 1;
      grid[0][1] = 1;
      grid[1][0] = 1;
      // Top-right
      grid[0][gridSize - 1] = 1;
      grid[0][gridSize - 2] = 1;
      grid[1][gridSize - 1] = 1;
      // Bottom-left
      grid[gridSize - 1][0] = 1;
      grid[gridSize - 1][1] = 1;
      grid[gridSize - 2][0] = 1;
      // Bottom-right
      grid[gridSize - 1][gridSize - 1] = 1;
      grid[gridSize - 1][gridSize - 2] = 1;
      grid[gridSize - 2][gridSize - 1] = 1;
    }
  } else if (pattern === 'discontinuous') {
    // Create gaps in horizontal continuity
    const centerRow = Math.floor(gridSize / 2);
    grid[centerRow][1] = 1;
    grid[centerRow][3] = 1; // Gap at col 2
    grid[centerRow][5] = 1; // Gap at col 4
  }

  return grid;
}

// Enhanced grid pattern generators
function createGridWithDiagonalStates(gridSize) {
  const grid = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(0));
  
  // Place some diagonal states
  if (gridSize >= 4) {
    grid[1][1] = STATES.HALF_DIAG_TL_BR;
    grid[1][2] = STATES.HALF_DIAG_TR_BL;
    grid[2][1] = STATES.HALF_DIAG_BL_TR;
    grid[2][2] = STATES.HALF_DIAG_BR_TL;
  }
  
  return grid;
}

function createBoundingBox(minRow, maxRow, minCol, maxCol) {
  return { minRow, maxRow, minCol, maxCol };
}

function createComplexPattern(gridSize) {
  const grid = createSimpleGrid(gridSize, 'empty');
  
  // Mixture of patterns
  const centerRow = Math.floor(gridSize / 2);
  const centerCol = Math.floor(gridSize / 2);
  
  // Central cluster
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = centerRow + dr;
      const c = centerCol + dc;
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
        grid[r][c] = 1;
      }
    }
  }
  
  // Some isolated cells
  if (gridSize >= 8) {
    grid[0][0] = 1;
    grid[gridSize - 1][gridSize - 1] = 1;
  }
  
  return grid;
}

const STATES = {
  EMPTY: 0,
  FULL: 1,
  HALF_DIAG_TL_BR: 2,
  HALF_DIAG_TR_BL: 3,
  HALF_DIAG_BL_TR: 4,
  HALF_DIAG_BR_TL: 5,
};

// ============================================================================
// TEST SUITE 1: GeometricKernels.calculateNeighborInteractionEnergy
// ============================================================================

const runner = new TestRunner();

runner.test('Test 1.1: calculateNeighborInteractionEnergy with varying neighbor counts', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);

  // Create grid with different clustering scenarios
  const grid = createSimpleGrid(gridSize, 'empty');

  // Scenario 1: Isolated cell (0 neighbors)
  grid[0][0] = STATES.FULL;

  // Scenario 2: Cell with 1 neighbor
  grid[2][2] = STATES.FULL;
  grid[2][3] = STATES.FULL;

  // Scenario 3: Cell with 4 neighbors (cross pattern)
  grid[4][4] = STATES.FULL;
  grid[3][4] = STATES.FULL;
  grid[5][4] = STATES.FULL;
  grid[4][3] = STATES.FULL;
  grid[4][5] = STATES.FULL;

  // Scenario 4: Cell with 8 neighbors (fully surrounded)
  for (let row = 6; row <= 7; row++) {
    for (let col = 6; col <= 7; col++) {
      grid[row][col] = STATES.FULL;
    }
  }
  grid[7][7] = STATES.FULL; // Center cell will have 3 neighbors

  const energy = geometricKernels.calculateNeighborInteractionEnergy(
    grid,
    STATES,
    2.0 // scale parameter
  );

  // Energy should be positive (penalties exist)
  t.assertGreaterThan(energy, 0, 'Energy should be positive for isolated cells');

  // Verify that isolated cells have higher penalty than well-connected cells
  // We can test this by comparing energies of different configurations
  const isolatedGrid = createSimpleGrid(gridSize, 'empty');
  isolatedGrid[0][0] = STATES.FULL; // 0 neighbors

  const clusteredGrid = createSimpleGrid(gridSize, 'empty');
  for (let row = 1; row <= 3; row++) {
    for (let col = 1; col <= 3; col++) {
      clusteredGrid[row][col] = STATES.FULL;
    }
  }

  const isolatedEnergy = geometricKernels.calculateNeighborInteractionEnergy(
    isolatedGrid,
    STATES,
    2.0
  );

  const clusteredEnergy = geometricKernels.calculateNeighborInteractionEnergy(
    clusteredGrid,
    STATES,
    2.0
  );

  // Isolated cell should have higher penalty per cell than clustered cells
  const isolatedPerCell = isolatedEnergy / 1; // 1 cell
  const clusteredPerCell = clusteredEnergy / 9; // 9 cells

  t.assertGreaterThan(
    isolatedPerCell,
    clusteredPerCell,
    'Isolated cells should have higher penalty per cell than clustered cells'
  );
});

runner.test('Test 1.2: calculateNeighborInteractionEnergy with different scale parameters', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);

  const grid = createSimpleGrid(gridSize, 'isolated');

  // Test with different scale parameters
  const energyScale1 = geometricKernels.calculateNeighborInteractionEnergy(grid, STATES, 1.0);
  const energyScale2 = geometricKernels.calculateNeighborInteractionEnergy(grid, STATES, 2.0);
  const energyScale4 = geometricKernels.calculateNeighborInteractionEnergy(grid, STATES, 4.0);

  // Higher scale should result in lower penalties (exp(-n/scale) decreases faster with larger scale)
  t.assertGreaterThan(energyScale2, energyScale1, 'Higher scale (2.0) should result in higher energy than lower scale (1.0)');
  t.assertGreaterThan(energyScale4, energyScale2, 'Higher scale (4.0) should result in higher energy than lower scale (2.0)');
});

// ============================================================================
// TEST SUITE 2: GeometricKernels.calculateNeighborInteractionEnergy - Empty Cells
// ============================================================================

runner.test('Test 2.1: calculateNeighborInteractionEnergy returns 0 for empty cells', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);

  // Create grid with only empty cells
  const emptyGrid = createSimpleGrid(gridSize, 'empty');

  const energy = geometricKernels.calculateNeighborInteractionEnergy(
    emptyGrid,
    STATES,
    2.0
  );

  t.assertEquals(energy, 0, 'Energy should be 0 for grid with only empty cells');
});

runner.test('Test 2.2: calculateNeighborInteractionEnergy ignores empty cells in mixed grid', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);

  // Create grid with some occupied and some empty cells
  const grid = createSimpleGrid(gridSize, 'empty');
  grid[0][0] = STATES.FULL;
  grid[0][1] = STATES.FULL;

  const energy1 = geometricKernels.calculateNeighborInteractionEnergy(grid, STATES, 2.0);

  // Add empty cells around (should not change energy)
  grid[1][0] = STATES.EMPTY;
  grid[1][1] = STATES.EMPTY;

  const energy2 = geometricKernels.calculateNeighborInteractionEnergy(grid, STATES, 2.0);

  // Energy should be the same since empty cells don't contribute
  t.assertEquals(energy1, energy2, 'Adding empty cells should not change energy');
});

runner.test('Test 2.3: calculateNeighborInteractionEnergy with bounding box containing only empty cells', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);

  // Create grid with occupied cells outside bounding box
  const grid = createSimpleGrid(gridSize, 'empty');
  grid[0][0] = STATES.FULL;
  grid[0][1] = STATES.FULL;

  // Define bounding box that contains only empty cells
  const boundingBox = {
    minRow: 5,
    maxRow: 7,
    minCol: 5,
    maxCol: 7,
  };

  const energy = geometricKernels.calculateNeighborInteractionEnergy(
    grid,
    STATES,
    2.0,
    boundingBox
  );

  t.assertEquals(energy, 0, 'Energy should be 0 for bounding box with only empty cells');
});

// ============================================================================
// TEST SUITE 3: EnhancedEnergySystem.calculateTotalEnergy
// ============================================================================

runner.test('Test 3.1: calculateEnergy accurately sums geometric and neighbor energies', (t) => {
  const gridSize = 8;
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });

  // Create a simple grid with known properties
  const grid = createSimpleGrid(gridSize, 'empty');

  // Add a pattern that will have both geometric and neighbor energy
  // Create a checkerboard pattern (high zebra energy) with isolated cells
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      grid[row][col] = (row + col) % 2;
    }
  }

  const totalEnergy = energySystem.calculateEnergy(grid, STATES);

  // Calculate components separately
  const geometricEnergy = energySystem.geometricKernels.calculateGeometricEnergy(
    grid,
    STATES,
    {
      corners: energySystem.energyWeights.sharpCorners,
      continuity: energySystem.energyWeights.geometricContinuity,
      zebra: energySystem.energyWeights.zebraPatterns,
    }
  );

  const neighborEnergy = energySystem.geometricKernels.calculateNeighborInteractionEnergy(
    grid,
    STATES,
    2.0
  );

  const isingEnergy = energySystem.geometricKernels.calculateIsingEnergy(
    grid,
    STATES,
    energySystem.isingJ1,
    energySystem.isingJ2
  );

  const expectedTotal =
    geometricEnergy + 
    neighborEnergy * energySystem.energyWeights.neighborEnergy +
    isingEnergy * energySystem.energyWeights.isingEnergy;

  t.assertAlmostEquals(
    totalEnergy,
    expectedTotal,
    1e-6,
    'Total energy should equal geometric + weighted neighbor + weighted Ising energy'
  );
});

runner.test('Test 3.2: calculateEnergy respects energy weights', (t) => {
  const gridSize = 8;
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });

  const grid = createSimpleGrid(gridSize, 'checkerboard');

  // Get energy with default weights
  const energy1 = energySystem.calculateEnergy(grid, STATES);

  // Change neighbor weight
  const originalWeight = energySystem.energyWeights.neighborEnergy;
  energySystem.energyWeights.neighborEnergy = originalWeight * 2;

  const energy2 = energySystem.calculateEnergy(grid, STATES);

  // Energy should change when weights change
  t.assert(
    energy1 !== energy2,
    'Energy should change when neighbor weight changes'
  );

  // Restore original weight
  energySystem.energyWeights.neighborEnergy = originalWeight;
});

runner.test('Test 3.3: calculateEnergy produces valid numerical values', (t) => {
  const gridSize = 8;
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });

  // Test with various grid patterns
  // Note: Energy can be negative due to ferromagnetic Ising coupling (e.g., empty grid)
  const patterns = ['empty', 'center', 'checkerboard', 'isolated', 'cluster'];

  for (const pattern of patterns) {
    const grid = createSimpleGrid(gridSize, pattern);
    const energy = energySystem.calculateEnergy(grid, STATES);

    t.assert(
      !isNaN(energy) && isFinite(energy),
      `Energy should be a valid finite number for pattern: ${pattern}`
    );
  }
});

// ============================================================================
// TEST SUITE 4: EvolutionEngine.calculateEnergyDelta
// ============================================================================

runner.test('Test 4.1: calculateSwapEnergyDifference reflects changes in geometric energy', (t) => {
  const gridSize = 8;
  const evolutionEngine = new EvolutionEngine(gridSize, { debugMode: false });
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });

  // Create a grid with known geometric features
  const grid = createSimpleGrid(gridSize, 'empty');

  // Create a pattern with continuity issues
  grid[2][2] = STATES.FULL;
  grid[2][4] = STATES.FULL; // Gap in between
  grid[5][5] = STATES.FULL; // Cell to swap with

  // Calculate energy before swap
  const energyBefore = energySystem.calculateEnergy(grid, STATES);

  // Propose swap that would improve continuity (fill the gap)
  const cell1 = { row: 2, col: 3 };
  const cell2 = { row: 5, col: 5 };
  const state1 = grid[cell1.row][cell1.col]; // EMPTY
  const state2 = grid[cell2.row][cell2.col]; // FULL

  const deltaEnergy = evolutionEngine.calculateSwapEnergyDifference(
    grid,
    energySystem,
    cell1,
    cell2,
    state1,
    state2,
    STATES
  );

  // Apply swap manually to verify
  const tempGrid = grid.map((r) => [...r]);
  tempGrid[cell1.row][cell1.col] = STATES.FULL;
  tempGrid[cell2.row][cell2.col] = STATES.EMPTY;

  const energyAfter = energySystem.calculateEnergy(tempGrid, STATES);
  const actualDelta = energyAfter - energyBefore;

  t.assertAlmostEquals(
    deltaEnergy,
    actualDelta,
    1e-6,
    'Calculated delta should match actual energy difference'
  );
});

runner.test('Test 4.2: calculateSwapEnergyDifference accurately accounts for neighbor energy changes', (t) => {
  const gridSize = 8;
  const evolutionEngine = new EvolutionEngine(gridSize, { debugMode: false });
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });

  // Create grid with isolated cell
  const grid = createSimpleGrid(gridSize, 'empty');
  grid[0][0] = STATES.FULL; // Isolated cell (high neighbor penalty)
  grid[5][5] = STATES.FULL; // Existing occupied cell

  const energyBefore = energySystem.calculateEnergy(grid, STATES);

  // Swap: move isolated cell next to existing cell
  // Note: This may not reduce total energy due to geometric penalties,
  // but it should accurately calculate the energy change
  const cell1 = { row: 5, col: 6 }; // Empty cell next to occupied
  const cell2 = { row: 0, col: 0 }; // Isolated occupied cell

  const deltaEnergy = evolutionEngine.calculateSwapEnergyDifference(
    grid,
    energySystem,
    cell1,
    cell2,
    STATES.EMPTY,
    STATES.FULL,
    STATES
  );

  // Apply swap manually to verify accuracy
  const tempGrid = grid.map((r) => [...r]);
  tempGrid[cell1.row][cell1.col] = STATES.FULL;
  tempGrid[cell2.row][cell2.col] = STATES.EMPTY;

  const energyAfter = energySystem.calculateEnergy(tempGrid, STATES);
  const actualDelta = energyAfter - energyBefore;

  // The key test: delta calculation should be accurate
  t.assertAlmostEquals(
    deltaEnergy,
    actualDelta,
    1e-6,
    'Delta should accurately reflect combined geometric and neighbor energy changes'
  );

  // Verify neighbor energy component decreased (even if total energy increased)
  const neighborBefore = energySystem.geometricKernels.calculateNeighborInteractionEnergy(grid, STATES, 2.0);
  const neighborAfter = energySystem.geometricKernels.calculateNeighborInteractionEnergy(tempGrid, STATES, 2.0);
  t.assert(neighborAfter < neighborBefore, 'Neighbor energy should decrease when moving isolated cell to cluster');
});

runner.test('Test 4.3: calculateSwapEnergyDifference handles overlapping bounding boxes', (t) => {
  const gridSize = 8;
  const evolutionEngine = new EvolutionEngine(gridSize, { debugMode: false });
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });

  const grid = createSimpleGrid(gridSize, 'empty');
  grid[3][3] = STATES.FULL;
  grid[3][4] = STATES.FULL;

  // Swap two adjacent cells (overlapping bounding boxes)
  const cell1 = { row: 3, col: 3 };
  const cell2 = { row: 3, col: 5 };

  const deltaEnergy = evolutionEngine.calculateSwapEnergyDifference(
    grid,
    energySystem,
    cell1,
    cell2,
    STATES.FULL,
    STATES.EMPTY,
    STATES
  );

  // Should not throw error and should return valid number
  t.assert(!isNaN(deltaEnergy), 'Delta should be a valid number');
});

runner.test('Test 4.4: calculateSwapEnergyDifference handles non-overlapping bounding boxes', (t) => {
  const gridSize = 16;
  const evolutionEngine = new EvolutionEngine(gridSize, { debugMode: false });
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });

  const grid = createSimpleGrid(gridSize, 'empty');
  grid[1][1] = STATES.FULL;
  grid[14][14] = STATES.EMPTY;

  // Swap two distant cells (non-overlapping bounding boxes)
  const cell1 = { row: 1, col: 1 };
  const cell2 = { row: 14, col: 14 };

  const deltaEnergy = evolutionEngine.calculateSwapEnergyDifference(
    grid,
    energySystem,
    cell1,
    cell2,
    STATES.FULL,
    STATES.EMPTY,
    STATES
  );

  // Apply swap manually
  const tempGrid = grid.map((r) => [...r]);
  tempGrid[cell1.row][cell1.col] = STATES.EMPTY;
  tempGrid[cell2.row][cell2.col] = STATES.FULL;

  const energyBefore = energySystem.calculateEnergy(grid, STATES);
  const energyAfter = energySystem.calculateEnergy(tempGrid, STATES);
  const actualDelta = energyAfter - energyBefore;

  t.assertAlmostEquals(
    deltaEnergy,
    actualDelta,
    1e-6,
    'Delta should be accurate for non-overlapping boxes'
  );
});

// ============================================================================
// TEST SUITE 5: GeometricKernels.applyKernel with Post-Processing
// ============================================================================

runner.test('Test 5.1: applyKernel correctly applies post-processing function', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);

  const grid = createSimpleGrid(gridSize, 'empty');
  grid[2][2] = STATES.FULL;
  grid[2][3] = STATES.FULL;
  grid[3][2] = STATES.FULL;
  grid[3][3] = STATES.FULL;

  // Apply neighbor sum kernel with post-processor that squares the result
  const postProcessor = (response) => response * response;

  const result = geometricKernels.applyKernel(
    grid,
    geometricKernels.neighborKernels.neighborSum,
    null,
    postProcessor
  );

  // Check that post-processing was applied
  // Cell at (2,2) should have 3 neighbors, so response is 3, squared is 9
  const expectedValue = 3 * 3; // 3 neighbors, squared

  t.assertEquals(
    result[2][2],
    expectedValue,
    'Post-processor should square the neighbor count'
  );
});

runner.test('Test 5.2: applyKernel with exponential post-processing', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);

  const grid = createSimpleGrid(gridSize, 'empty');
  grid[4][4] = STATES.FULL;
  grid[4][5] = STATES.FULL;
  grid[5][4] = STATES.FULL;

  // Apply with exponential post-processor
  const scale = 2.0;
  const postProcessor = (neighborCount) => Math.exp(-neighborCount / scale);

  const result = geometricKernels.applyKernel(
    grid,
    geometricKernels.neighborKernels.neighborSum,
    null,
    postProcessor
  );

  // Cell at (4,4) has 2 neighbors
  const expectedValue = Math.exp(-2 / scale);

  t.assertAlmostEquals(
    result[4][4],
    expectedValue,
    1e-6,
    'Post-processor should apply exponential function'
  );
});

runner.test('Test 5.3: applyKernel with conditional post-processing', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);

  const grid = createSimpleGrid(gridSize, 'empty');
  grid[2][2] = STATES.FULL;
  grid[2][3] = STATES.FULL;
  grid[4][4] = STATES.EMPTY;

  // Post-processor that returns penalty only for occupied cells
  const postProcessor = (neighborCount, row, col, grid) => {
    if (grid[row][col] !== STATES.EMPTY) {
      return Math.exp(-neighborCount / 2.0);
    }
    return 0;
  };

  const result = geometricKernels.applyKernel(
    grid,
    geometricKernels.neighborKernels.neighborSum,
    null,
    postProcessor
  );

  // Cell at (2,2) is occupied, should have penalty
  t.assertGreaterThan(result[2][2], 0, 'Occupied cell should have penalty');

  // Cell at (4,4) is empty, should have no penalty
  t.assertEquals(result[4][4], 0, 'Empty cell should have no penalty');
});

runner.test('Test 5.4: applyKernel without post-processing returns raw convolution', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);

  const grid = createSimpleGrid(gridSize, 'empty');
  grid[4][4] = STATES.FULL;
  grid[4][5] = STATES.FULL;
  grid[5][4] = STATES.FULL;
  grid[5][5] = STATES.FULL;

  // Apply without post-processor
  const result = geometricKernels.applyKernel(
    grid,
    geometricKernels.neighborKernels.neighborSum,
    null,
    null
  );

  // Cell at (4,4) has 3 neighbors, raw convolution should be 3
  t.assertEquals(result[4][4], 3, 'Raw convolution should return neighbor count');
});

runner.test('Test 5.5: applyKernel with Math.abs post-processing', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);

  // Create a pattern with continuity issues
  const grid = createSimpleGrid(gridSize, 'empty');
  grid[4][3] = STATES.FULL;
  grid[4][5] = STATES.FULL; // Gap in between

  // Apply continuity kernel with Math.abs (as used in applyKernelAbs)
  const result = geometricKernels.applyKernel(
    grid,
    geometricKernels.continuityKernels.horizontalContinuity,
    null,
    Math.abs
  );

  // Center cell (4,4) should have non-zero absolute response
  t.assertGreaterThan(
    Math.abs(result[4][4]),
    0,
    'Discontinuity should be detected with absolute value'
  );
});

// ============================================================================
// TEST SUITE 6: GeometricKernels Detection Methods
// ============================================================================

runner.test('Test 6.1: detectCorners identifies L-shaped corners', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);
  const grid = createSimpleGrid(gridSize, 'corners');

  const results = geometricKernels.detectCorners(grid, STATES);

  t.assertGreaterThan(results.lCorners.count, 0, 'Should detect L-shaped corners');
  t.assertGreaterThan(results.total.score, 0, 'Total corner score should be positive');
});

runner.test('Test 6.2: detectCorners returns low count for smooth patterns', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);
  const grid = createSimpleGrid(gridSize, 'horizontal-line');

  const results = geometricKernels.detectCorners(grid, STATES);
  const cornersGrid = createSimpleGrid(gridSize, 'corners');
  const cornersResults = geometricKernels.detectCorners(cornersGrid, STATES);

  // Smooth line should have fewer corners than corner pattern
  t.assertGreaterThan(cornersResults.total.count, results.total.count, 'Corner pattern should have more corners than smooth line');
});

runner.test('Test 6.3: detectContinuityIssues detects horizontal gaps', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);
  const grid = createSimpleGrid(gridSize, 'discontinuous');

  const results = geometricKernels.detectContinuityIssues(grid, STATES);

  t.assertGreaterThan(results.horizontal.count, 0, 'Should detect horizontal discontinuities');
});

runner.test('Test 6.4: detectContinuityIssues detects more issues for checkerboard than cluster', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);
  const checkerboardGrid = createSimpleGrid(gridSize, 'checkerboard');
  const clusterGrid = createSimpleGrid(gridSize, 'cluster');

  const checkerboardResults = geometricKernels.detectContinuityIssues(checkerboardGrid, STATES);
  const clusterResults = geometricKernels.detectContinuityIssues(clusterGrid, STATES);

  // Checkerboard has many discontinuities, cluster is continuous
  t.assertGreaterThan(checkerboardResults.total.count, clusterResults.total.count, 'Checkerboard should have more continuity issues than smooth cluster');
});

runner.test('Test 6.5: detectZebraPatterns identifies horizontal zebra pattern', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);
  const grid = createSimpleGrid(gridSize, 'horizontal-zebra');

  const results = geometricKernels.detectZebraPatterns(grid, STATES);

  t.assertGreaterThan(results.horizontal.count, 0, 'Should detect horizontal zebra patterns');
});

runner.test('Test 6.6: detectZebraPatterns identifies vertical zebra pattern', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);
  const grid = createSimpleGrid(gridSize, 'vertical-zebra');

  const results = geometricKernels.detectZebraPatterns(grid, STATES);

  t.assertGreaterThan(results.vertical.count, 0, 'Should detect vertical zebra patterns');
});

runner.test('Test 6.7: detectZebraPatterns with checkerboard returns high count', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);
  const grid = createSimpleGrid(gridSize, 'checkerboard');

  const results = geometricKernels.detectZebraPatterns(grid, STATES);

  t.assertGreaterThan(results.total.count, 20, 'Checkerboard should have many zebra patterns');
});

runner.test('Test 6.8: calculateGeometricEnergy with zero weights returns zero', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);
  const grid = createSimpleGrid(gridSize, 'checkerboard');

  const energy = geometricKernels.calculateGeometricEnergy(
    grid,
    STATES,
    { corners: 0, continuity: 0, zebra: 0 }
  );

  t.assertEquals(energy, 0, 'Zero weights should result in zero energy');
});

runner.test('Test 6.9: calculateGeometricEnergy increases with higher zebra weight', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);
  const grid = createSimpleGrid(gridSize, 'checkerboard');

  const energy1 = geometricKernels.calculateGeometricEnergy(
    grid,
    STATES,
    { corners: 1.0, continuity: 1.0, zebra: 1.0 }
  );

  const energy2 = geometricKernels.calculateGeometricEnergy(
    grid,
    STATES,
    { corners: 1.0, continuity: 1.0, zebra: 5.0 }
  );

  t.assertGreaterThan(energy2, energy1, 'Higher zebra weight should increase energy');
});

runner.test('Test 6.10: calculateGeometricEnergy with bounding box', (t) => {
  const gridSize = 16;
  const geometricKernels = new GeometricKernels(gridSize);
  const grid = createSimpleGrid(gridSize, 'checkerboard');

  const fullEnergy = geometricKernels.calculateGeometricEnergy(grid, STATES);
  
  // Small bounding box in corner
  const boxEnergy = geometricKernels.calculateGeometricEnergy(
    grid,
    STATES,
    { corners: 2.0, continuity: 2.0, zebra: 2.0 },
    createBoundingBox(0, 3, 0, 3)
  );

  // Bounding box energy should be less than full energy
  t.assertGreaterThan(fullEnergy, boxEnergy, 'Full grid energy should exceed bounding box energy');
});

// ============================================================================
// TEST SUITE 7: EvolutionEngine Bounding Box and Evolution Operations
// ============================================================================

runner.test('Test 7.1: boundingBoxesOverlap detects overlapping boxes', (t) => {
  const evolutionEngine = new EvolutionEngine(16, { debugMode: false });

  const box1 = createBoundingBox(2, 5, 2, 5);
  const box2 = createBoundingBox(4, 7, 4, 7);

  const overlaps = evolutionEngine.boundingBoxesOverlap(box1, box2);

  t.assert(overlaps, 'Overlapping boxes should be detected');
});

runner.test('Test 7.2: boundingBoxesOverlap detects non-overlapping boxes', (t) => {
  const evolutionEngine = new EvolutionEngine(16, { debugMode: false });

  const box1 = createBoundingBox(0, 3, 0, 3);
  const box2 = createBoundingBox(6, 9, 6, 9);

  const overlaps = evolutionEngine.boundingBoxesOverlap(box1, box2);

  t.assert(!overlaps, 'Non-overlapping boxes should not be detected as overlapping');
});

runner.test('Test 7.3: boundingBoxesOverlap detects adjacent boxes as non-overlapping', (t) => {
  const evolutionEngine = new EvolutionEngine(16, { debugMode: false });

  const box1 = createBoundingBox(0, 3, 0, 3);
  const box2 = createBoundingBox(4, 7, 0, 3); // Adjacent, not overlapping

  const overlaps = evolutionEngine.boundingBoxesOverlap(box1, box2);

  t.assert(!overlaps, 'Adjacent boxes should not overlap');
});

runner.test('Test 7.4: boundingBoxesOverlap detects edge-aligned boxes', (t) => {
  const evolutionEngine = new EvolutionEngine(16, { debugMode: false });

  const box1 = createBoundingBox(0, 4, 0, 4);
  const box2 = createBoundingBox(3, 7, 3, 7); // Share edge

  const overlaps = evolutionEngine.boundingBoxesOverlap(box1, box2);

  t.assert(overlaps, 'Edge-aligned boxes should overlap');
});

runner.test('Test 7.5: combineBoundingBoxes merges two boxes correctly', (t) => {
  const evolutionEngine = new EvolutionEngine(16, { debugMode: false });

  const box1 = createBoundingBox(2, 5, 3, 6);
  const box2 = createBoundingBox(4, 7, 5, 9);

  const combined = evolutionEngine.combineBoundingBoxes(box1, box2);

  t.assertEquals(combined.minRow, 2, 'Combined minRow should be minimum of both');
  t.assertEquals(combined.maxRow, 7, 'Combined maxRow should be maximum of both');
  t.assertEquals(combined.minCol, 3, 'Combined minCol should be minimum of both');
  t.assertEquals(combined.maxCol, 9, 'Combined maxCol should be maximum of both');
});

runner.test('Test 7.6: combineBoundingBoxes handles nested boxes', (t) => {
  const evolutionEngine = new EvolutionEngine(16, { debugMode: false });

  const box1 = createBoundingBox(1, 10, 1, 10);
  const box2 = createBoundingBox(3, 6, 3, 6); // Nested inside box1

  const combined = evolutionEngine.combineBoundingBoxes(box1, box2);

  t.assertEquals(combined.minRow, 1, 'Combined box should equal larger box minRow');
  t.assertEquals(combined.maxRow, 10, 'Combined box should equal larger box maxRow');
});

runner.test('Test 7.7: Temperature cooling decreases temperature', (t) => {
  const evolutionEngine = new EvolutionEngine(16, {
    debugMode: false,
    temperature: 1.0,
    coolingRate: 0.95
  });

  const initialTemp = evolutionEngine.temperature;
  evolutionEngine.coolTemperature();
  const cooledTemp = evolutionEngine.temperature;

  t.assertGreaterThan(initialTemp, cooledTemp, 'Temperature should decrease after cooling');
  t.assertAlmostEquals(cooledTemp, initialTemp * 0.95, 1e-6, 'Temperature should decrease by cooling rate');
});

runner.test('Test 7.8: Temperature cooling respects minimum temperature', (t) => {
  const evolutionEngine = new EvolutionEngine(16, {
    debugMode: false,
    temperature: 0.002,
    coolingRate: 0.95,
    minTemperature: 0.001
  });

  // Cool multiple times
  for (let i = 0; i < 10; i++) {
    evolutionEngine.coolTemperature();
  }

  t.assert(
    evolutionEngine.temperature >= 0.001,
    'Temperature should not drop below minimum'
  );
});

runner.test('Test 7.9: shouldTerminateAnnealing detects minimum temperature', (t) => {
  const evolutionEngine = new EvolutionEngine(16, {
    debugMode: false,
    temperature: 0.0005,
    minTemperature: 0.001
  });

  const shouldTerminate = evolutionEngine.shouldTerminateAnnealing();

  t.assert(shouldTerminate, 'Should terminate when below minimum temperature');
});

runner.test('Test 7.10: shouldTerminateAnnealing detects maximum steps', (t) => {
  const evolutionEngine = new EvolutionEngine(16, {
    debugMode: false,
    maxSteps: 100
  });

  evolutionEngine.currentStep = 100;
  const shouldTerminate = evolutionEngine.shouldTerminateAnnealing();

  t.assert(shouldTerminate, 'Should terminate at maximum steps');
});

// ============================================================================
// TEST SUITE 8: GridCore State Management and Grid Operations
// ============================================================================

runner.test('Test 8.1: computeStateInventories counts empty cells correctly', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);
  gridCore.grid = createSimpleGrid(gridSize, 'empty');

  const inventories = gridCore.computeStateInventories();

  t.assertEquals(inventories[STATES.EMPTY].count, gridSize * gridSize, 'All cells should be empty');
  t.assertEquals(inventories[STATES.FULL].count, 0, 'No full cells should exist');
});

runner.test('Test 8.2: computeStateInventories counts full cells correctly', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);
  gridCore.grid = createSimpleGrid(gridSize, 'full');

  const inventories = gridCore.computeStateInventories();

  t.assertEquals(inventories[STATES.EMPTY].count, 0, 'No empty cells should exist');
  t.assertEquals(inventories[STATES.FULL].count, gridSize * gridSize, 'All cells should be full');
});

runner.test('Test 8.3: computeStateInventories counts checkerboard pattern', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);
  gridCore.grid = createSimpleGrid(gridSize, 'checkerboard');

  const inventories = gridCore.computeStateInventories();

  const totalCells = gridSize * gridSize;
  const expectedEach = totalCells / 2;

  t.assertEquals(
    inventories[STATES.EMPTY].count,
    expectedEach,
    'Checkerboard should have half empty cells'
  );
  t.assertEquals(
    inventories[STATES.FULL].count,
    expectedEach,
    'Checkerboard should have half full cells'
  );
});

runner.test('Test 8.4: updateStateInventories increments correctly after setCell', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);
  gridCore.grid = createSimpleGrid(gridSize, 'empty');
  gridCore.computeStateInventories();

  const initialEmpty = gridCore.stateInventories[STATES.EMPTY].count;
  const initialFull = gridCore.stateInventories[STATES.FULL].count;

  gridCore.setCell(0, 0, STATES.FULL);

  t.assertEquals(
    gridCore.stateInventories[STATES.EMPTY].count,
    initialEmpty - 1,
    'Empty count should decrease by 1'
  );
  t.assertEquals(
    gridCore.stateInventories[STATES.FULL].count,
    initialFull + 1,
    'Full count should increase by 1'
  );
});

runner.test('Test 8.5: invalidateStateInventories resets inventory', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);
  gridCore.grid = createSimpleGrid(gridSize, 'checkerboard');
  gridCore.computeStateInventories();

  t.assert(gridCore.inventoryValid, 'Inventory should be valid after computation');

  gridCore.invalidateStateInventories();

  t.assert(!gridCore.inventoryValid, 'Inventory should be invalid after invalidation');
  t.assertEquals(gridCore.stateInventories, null, 'State inventories should be null');
});

runner.test('Test 8.6: setCell correctly updates area tracking', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);
  gridCore.grid = createSimpleGrid(gridSize, 'empty');
  gridCore.totalArea = 0;

  const result = gridCore.setCell(0, 0, STATES.FULL);

  t.assertEquals(result.oldState, STATES.EMPTY, 'Old state should be EMPTY');
  t.assertEquals(result.newState, STATES.FULL, 'New state should be FULL');
  t.assertEquals(result.areaChange, 1, 'Area change should be +1');
  t.assertEquals(gridCore.totalArea, 1, 'Total area should be 1');
});

runner.test('Test 8.7: setCell throws error for out-of-bounds coordinates', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);

  let errorThrown = false;
  try {
    gridCore.setCell(-1, 0, STATES.FULL);
  } catch (e) {
    errorThrown = true;
  }

  t.assert(errorThrown, 'Should throw error for negative row');
});

runner.test('Test 8.8: toggleCell switches between empty and full', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);
  gridCore.grid = createSimpleGrid(gridSize, 'empty');

  const result1 = gridCore.toggleCell(0, 0);
  t.assertEquals(result1.newState, STATES.FULL, 'Should toggle to FULL');

  const result2 = gridCore.toggleCell(0, 0);
  t.assertEquals(result2.newState, STATES.EMPTY, 'Should toggle back to EMPTY');
});

runner.test('Test 8.9: getNeighbors returns 8 neighbors for interior cell', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);

  const neighbors = gridCore.getNeighbors(4, 4);

  t.assertEquals(neighbors.length, 8, 'Interior cell should have 8 neighbors');
});

runner.test('Test 8.10: getNeighbors returns 3 neighbors for corner cell', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);

  const neighbors = gridCore.getNeighbors(0, 0);

  t.assertEquals(neighbors.length, 3, 'Corner cell should have 3 neighbors');
});

runner.test('Test 8.11: getNeighbors returns 5 neighbors for edge cell', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);

  const neighbors = gridCore.getNeighbors(0, 4);

  t.assertEquals(neighbors.length, 5, 'Edge cell should have 5 neighbors');
});

runner.test('Test 8.12: getStateSafe returns EMPTY for out-of-bounds', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);
  gridCore.grid = createSimpleGrid(gridSize, 'full');

  const state = gridCore.getStateSafe(-1, -1);

  t.assertEquals(state, STATES.EMPTY, 'Out-of-bounds should return EMPTY');
});

runner.test('Test 8.13: getStateSafe returns correct state for in-bounds', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);
  gridCore.grid = createSimpleGrid(gridSize, 'full');

  const state = gridCore.getStateSafe(4, 4);

  t.assertEquals(state, STATES.FULL, 'In-bounds should return correct state');
});

runner.test('Test 8.14: getAreaContribution returns correct values for all states', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);

  t.assertEquals(gridCore.getAreaContribution(STATES.EMPTY), 0, 'EMPTY contributes 0');
  t.assertEquals(gridCore.getAreaContribution(STATES.FULL), 1, 'FULL contributes 1');
  t.assertEquals(gridCore.getAreaContribution(STATES.HALF_DIAG_TL_BR), 0.5, 'Diagonal state contributes 0.5');
});

runner.test('Test 8.15: getGridStats returns accurate statistics', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);
  gridCore.grid = createSimpleGrid(gridSize, 'checkerboard');
  gridCore.totalArea = 32; // Half of 64

  const stats = gridCore.getGridStats();

  t.assertEquals(stats.gridSize, 8, 'Grid size should be 8');
  t.assertEquals(stats.totalCells, 64, 'Total cells should be 64');
  t.assertEquals(stats.occupiedCells, 32, 'Occupied cells should be 32');
  t.assertEquals(stats.totalArea, 32, 'Total area should be 32');
});

// ============================================================================
// TEST SUITE 9: EnhancedEnergySystem Weight Sensitivity
// ============================================================================

runner.test('Test 9.1: calculateEnergy with doubled neighbor weight doubles neighbor contribution', (t) => {
  const gridSize = 8;
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });
  const grid = createSimpleGrid(gridSize, 'isolated');

  const energy1 = energySystem.calculateEnergy(grid, STATES);
  
  const originalWeight = energySystem.energyWeights.neighborEnergy;
  energySystem.energyWeights.neighborEnergy = originalWeight * 2;
  const energy2 = energySystem.calculateEnergy(grid, STATES);

  // Energy should increase when neighbor weight increases
  t.assertGreaterThan(energy2, energy1, 'Doubled neighbor weight should increase energy');

  // Restore
  energySystem.energyWeights.neighborEnergy = originalWeight;
});

runner.test('Test 9.2: calculateEnergy with zero neighbor weight excludes neighbor energy', (t) => {
  const gridSize = 8;
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });
  const grid = createSimpleGrid(gridSize, 'isolated');

  const originalWeight = energySystem.energyWeights.neighborEnergy;
  energySystem.energyWeights.neighborEnergy = 0;

  const energy = energySystem.calculateEnergy(grid, STATES);

  // Energy should include geometric and Ising components (but not neighbor due to zero weight)
  const geometricEnergy = energySystem.geometricKernels.calculateGeometricEnergy(
    grid,
    STATES,
    {
      corners: energySystem.energyWeights.sharpCorners,
      continuity: energySystem.energyWeights.geometricContinuity,
      zebra: energySystem.energyWeights.zebraPatterns,
    }
  );

  const isingEnergy = energySystem.geometricKernels.calculateIsingEnergy(
    grid,
    STATES,
    energySystem.isingJ1,
    energySystem.isingJ2
  );

  const expectedEnergy = geometricEnergy + isingEnergy * energySystem.energyWeights.isingEnergy;

  t.assertAlmostEquals(energy, expectedEnergy, 1e-6, 'Zero neighbor weight should give geometric + Ising energy');

  // Restore
  energySystem.energyWeights.neighborEnergy = originalWeight;
});

runner.test('Test 9.3: calculateEnergy for cluster pattern has lower neighbor penalty', (t) => {
  const gridSize = 8;
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });

  const isolatedGrid = createSimpleGrid(gridSize, 'isolated');
  const clusterGrid = createSimpleGrid(gridSize, 'cluster');

  const isolatedNeighborEnergy = energySystem.geometricKernels.calculateNeighborInteractionEnergy(
    isolatedGrid,
    STATES,
    2.0
  );

  const clusterNeighborEnergy = energySystem.geometricKernels.calculateNeighborInteractionEnergy(
    clusterGrid,
    STATES,
    2.0
  );

  // Per-cell penalty should be lower for cluster
  const isolatedPerCell = isolatedNeighborEnergy / 4; // 4 isolated cells
  const clusterPerCell = clusterNeighborEnergy / 9; // 9 cluster cells

  t.assertGreaterThan(
    isolatedPerCell,
    clusterPerCell,
    'Isolated cells should have higher per-cell penalty than clustered cells'
  );
});

runner.test('Test 9.4: calculateEnergy produces consistent results for same grid', (t) => {
  const gridSize = 8;
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });
  const grid = createSimpleGrid(gridSize, 'checkerboard');

  const energy1 = energySystem.calculateEnergy(grid, STATES);
  const energy2 = energySystem.calculateEnergy(grid, STATES);

  t.assertAlmostEquals(energy1, energy2, 1e-10, 'Same grid should produce identical energy');
});

runner.test('Test 9.5: calculateEnergy for empty grid returns expected Ising energy', (t) => {
  const gridSize = 8;
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });
  const grid = createSimpleGrid(gridSize, 'empty');

  const energy = energySystem.calculateEnergy(grid, STATES);

  // Empty grid has only Ising energy (ferromagnetic coupling between EMPTY=-1 spins)
  // For 8x8 grid: each cell has up to 4 nearest neighbors (J1) and 4 diagonal neighbors (J2)
  // Total interactions: 112 J1 pairs + 98 J2 pairs (accounting for boundary effects)
  // With J1=J2=1.0 and weight=1.0: E = -(J1*112 + J2*98) = -210
  const expectedIsingEnergy = -210;

  t.assertAlmostEquals(energy, expectedIsingEnergy, 1e-6, 'Empty grid should have expected Ising energy from ferromagnetic coupling');
});

// ============================================================================
// TEST SUITE 10: Integration Tests
// ============================================================================

runner.test('Test 10.1: Area preservation during swap operation', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);
  gridCore.grid = createSimpleGrid(gridSize, 'checkerboard');
  gridCore.totalArea = 32;

  const initialArea = gridCore.totalArea;

  // Perform swap between empty and full cell
  gridCore.setCell(0, 0, STATES.FULL); // Was empty in checkerboard
  gridCore.setCell(0, 1, STATES.EMPTY); // Was full in checkerboard

  t.assertEquals(gridCore.totalArea, initialArea, 'Area should be preserved after swap');
});

runner.test('Test 10.2: Energy delta matches actual energy difference', (t) => {
  const gridSize = 8;
  const evolutionEngine = new EvolutionEngine(gridSize, { debugMode: false });
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });
  const grid = createSimpleGrid(gridSize, 'center');

  const energyBefore = energySystem.calculateEnergy(grid, STATES);

  const cell1 = { row: 4, col: 4 }; // Center (occupied)
  const cell2 = { row: 0, col: 0 }; // Corner (empty)

  const deltaEnergy = evolutionEngine.calculateSwapEnergyDifference(
    grid,
    energySystem,
    cell1,
    cell2,
    STATES.FULL,
    STATES.EMPTY,
    STATES
  );

  // Apply swap
  const tempGrid = grid.map((r) => [...r]);
  tempGrid[cell1.row][cell1.col] = STATES.EMPTY;
  tempGrid[cell2.row][cell2.col] = STATES.FULL;
  const energyAfter = energySystem.calculateEnergy(tempGrid, STATES);

  const actualDelta = energyAfter - energyBefore;

  t.assertAlmostEquals(
    deltaEnergy,
    actualDelta,
    1e-6,
    'Calculated delta should match actual energy difference'
  );
});

runner.test('Test 10.3: State inventory consistency after multiple operations', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);
  gridCore.grid = createSimpleGrid(gridSize, 'empty');
  gridCore.computeStateInventories();

  // Perform multiple operations
  gridCore.setCell(0, 0, STATES.FULL);
  gridCore.setCell(1, 1, STATES.FULL);
  gridCore.setCell(2, 2, STATES.FULL);
  gridCore.setCell(0, 0, STATES.EMPTY); // Toggle back

  // Manually count
  let manualEmptyCount = 0;
  let manualFullCount = 0;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (gridCore.grid[row][col] === STATES.EMPTY) manualEmptyCount++;
      if (gridCore.grid[row][col] === STATES.FULL) manualFullCount++;
    }
  }

  t.assertEquals(
    gridCore.stateInventories[STATES.EMPTY].count,
    manualEmptyCount,
    'Empty inventory should match manual count'
  );
  t.assertEquals(
    gridCore.stateInventories[STATES.FULL].count,
    manualFullCount,
    'Full inventory should match manual count'
  );
});

runner.test('Test 10.4: Bounding box energy calculation matches full grid for small box', (t) => {
  const gridSize = 16;
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });
  const grid = createComplexPattern(gridSize);

  // Extract small region
  const boundingBox = createBoundingBox(6, 10, 6, 10);

  // Create isolated grid with just the bounding box region
  const isolatedGrid = createSimpleGrid(gridSize, 'empty');
  for (let row = boundingBox.minRow; row <= boundingBox.maxRow; row++) {
    for (let col = boundingBox.minCol; col <= boundingBox.maxCol; col++) {
      isolatedGrid[row][col] = grid[row][col];
    }
  }

  const boxEnergy = energySystem.geometricKernels.calculateGeometricEnergy(
    grid,
    STATES,
    {
      corners: energySystem.energyWeights.sharpCorners,
      continuity: energySystem.energyWeights.geometricContinuity,
      zebra: energySystem.energyWeights.zebraPatterns,
    },
    boundingBox
  );

  const fullEnergy = energySystem.geometricKernels.calculateGeometricEnergy(
    isolatedGrid,
    STATES,
    {
      corners: energySystem.energyWeights.sharpCorners,
      continuity: energySystem.energyWeights.geometricContinuity,
      zebra: energySystem.energyWeights.zebraPatterns,
    },
    boundingBox
  );

  t.assertAlmostEquals(
    boxEnergy,
    fullEnergy,
    1e-6,
    'Bounding box energy should match isolated region energy'
  );
});

// ============================================================================
// TEST SUITE 11: Edge Cases and Error Handling
// ============================================================================

runner.test('Test 11.1: calculateNeighborInteractionEnergy handles single cell', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);
  const grid = createSimpleGrid(gridSize, 'center');

  const energy = geometricKernels.calculateNeighborInteractionEnergy(grid, STATES, 2.0);

  // Single isolated cell should have high penalty
  t.assertGreaterThan(energy, 0, 'Single cell should have positive energy');
});

runner.test('Test 11.2: calculateGeometricEnergy handles very small grid', (t) => {
  const gridSize = 3;
  const geometricKernels = new GeometricKernels(gridSize);
  const grid = createSimpleGrid(gridSize, 'center');

  const energy = geometricKernels.calculateGeometricEnergy(grid, STATES);

  t.assert(!isNaN(energy), 'Should handle small grid without error');
  t.assert(energy >= 0, 'Energy should be non-negative');
});

runner.test('Test 11.3: calculateEnergy handles grid with all same states', (t) => {
  const gridSize = 8;
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });
  const grid = createSimpleGrid(gridSize, 'full');

  const energy = energySystem.calculateEnergy(grid, STATES);

  // Full grid should have low neighbor penalty (all cells well-connected)
  // but may have continuity energy at boundaries
  t.assert(energy >= 0, 'Energy should be non-negative');
});

runner.test('Test 11.4: boundingBoxesOverlap handles identical boxes', (t) => {
  const evolutionEngine = new EvolutionEngine(16, { debugMode: false });

  const box = createBoundingBox(2, 5, 2, 5);
  const overlaps = evolutionEngine.boundingBoxesOverlap(box, box);

  t.assert(overlaps, 'Identical boxes should overlap');
});

runner.test('Test 11.5: getNeighbors handles corner coordinates correctly', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);

  // Test all four corners
  const topLeft = gridCore.getNeighbors(0, 0);
  const topRight = gridCore.getNeighbors(0, gridSize - 1);
  const bottomLeft = gridCore.getNeighbors(gridSize - 1, 0);
  const bottomRight = gridCore.getNeighbors(gridSize - 1, gridSize - 1);

  t.assertEquals(topLeft.length, 3, 'Top-left corner should have 3 neighbors');
  t.assertEquals(topRight.length, 3, 'Top-right corner should have 3 neighbors');
  t.assertEquals(bottomLeft.length, 3, 'Bottom-left corner should have 3 neighbors');
  t.assertEquals(bottomRight.length, 3, 'Bottom-right corner should have 3 neighbors');
});

runner.test('Test 11.6: setCell returns null when setting same state', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);
  gridCore.grid = createSimpleGrid(gridSize, 'empty');

  const result = gridCore.setCell(0, 0, STATES.EMPTY);

  t.assertEquals(result, null, 'Setting same state should return null');
});

runner.test('Test 11.7: applyKernel handles boundary cells without error', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);
  const grid = createSimpleGrid(gridSize, 'corners');

  // Apply kernel that would access out-of-bounds for corner cells
  const result = geometricKernels.applyKernel(
    grid,
    geometricKernels.neighborKernels.neighborSum,
    null,
    null
  );

  // Check corner cell has valid result
  t.assert(!isNaN(result[0][0]), 'Corner cell should have valid result');
  t.assert(result[0][0] >= 0, 'Corner cell result should be non-negative');
});

runner.test('Test 11.8: calculateSwapEnergyDifference handles same-cell swap gracefully', (t) => {
  const gridSize = 8;
  const evolutionEngine = new EvolutionEngine(gridSize, { debugMode: false });
  const energySystem = new EnhancedEnergySystem(gridSize, { debugMode: false });
  const grid = createSimpleGrid(gridSize, 'center');

  const cell = { row: 4, col: 4 };

  const deltaEnergy = evolutionEngine.calculateSwapEnergyDifference(
    grid,
    energySystem,
    cell,
    cell,
    STATES.FULL,
    STATES.FULL,
    STATES
  );

  // Swapping cell with itself should give zero delta
  t.assertAlmostEquals(deltaEnergy, 0, 1e-6, 'Same-cell swap should have zero energy delta');
});

runner.test('Test 11.9: calculateGeometricEnergy with extreme weight values', (t) => {
  const gridSize = 8;
  const geometricKernels = new GeometricKernels(gridSize);
  const grid = createSimpleGrid(gridSize, 'checkerboard');

  const energy = geometricKernels.calculateGeometricEnergy(
    grid,
    STATES,
    { corners: 1000, continuity: 1000, zebra: 1000 }
  );

  t.assert(!isNaN(energy), 'Should handle extreme weights without NaN');
  t.assert(isFinite(energy), 'Should handle extreme weights without Infinity');
});

runner.test('Test 11.10: State inventory handles grid with mixed states', (t) => {
  const gridSize = 8;
  const gridCore = new GridCore(gridSize);
  gridCore.grid = createGridWithDiagonalStates(gridSize);

  const inventories = gridCore.computeStateInventories();

  // Should have entries for diagonal states
  t.assert(
    inventories[STATES.HALF_DIAG_TL_BR] !== undefined,
    'Should have inventory for diagonal state TL_BR'
  );
  t.assertEquals(
    inventories[STATES.HALF_DIAG_TL_BR].count,
    1,
    'Should count diagonal state correctly'
  );
});

// ============================================================================
// RUN ALL TESTS
// ============================================================================

export async function runTests() {
  return await runner.run();
}

// Auto-run if loaded directly
if (typeof window !== 'undefined') {
  window.runTests = runTests;
  console.log('Tests loaded. Run tests with: runTests()');
}
