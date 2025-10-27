/**
 * Geometric Feature Detection Kernels for 6-State System
 * Modular kernel-based approach for detecting unwanted geometric features
 */

export class GeometricKernels {
  constructor(gridSize) {
    this.gridSize = gridSize;
    this.debugMode = false;

    // Initialize all kernel systems
    this.cornerKernels = this.initializeCornerKernels();
    this.continuityKernels = this.initializeContinuityKernels();
    this.zebraKernels = this.initializeZebraKernels();
    this.neighborKernels = this.initializeNeighborKernels();

    this.log("Geometric kernels initialized with zebra pattern detection and neighbor interaction");
  }

  // ============================================================================
  // CORNER DETECTION KERNELS
  // ============================================================================

  /**
   * Initialize kernels for detecting sharp corners and geometric discontinuities
   */
  initializeCornerKernels() {
    return {
      // L-shaped corner detectors (3x3 kernels)
      topLeftCorner: {
        kernel: [
          [2, -1, 0],
          [-1, 1, 0],
          [0, 0, 0],
        ],
        description: "Detects top-left L-shaped corners",
      },
      topRightCorner: {
        kernel: [
          [0, -1, 2],
          [0, 1, -1],
          [0, 0, 0],
        ],
        description: "Detects top-right L-shaped corners",
      },
      bottomLeftCorner: {
        kernel: [
          [0, 0, 0],
          [-1, 1, 0],
          [2, -1, 0],
        ],
        description: "Detects bottom-left L-shaped corners",
      },
      bottomRightCorner: {
        kernel: [
          [0, 0, 0],
          [0, 1, -1],
          [0, -1, 2],
        ],
        description: "Detects bottom-right L-shaped corners",
      },

      // Diagonal conflict detectors (3x3 kernels)
      diagonalConflictTL: {
        kernel: [
          [0, 1, 0],
          [1, -2, -1],
          [0, -1, 1],
        ],
        description: "Detects diagonal state conflicts (TL-BR)",
      },
      diagonalConflictTR: {
        kernel: [
          [0, 1, 0],
          [-1, -2, 1],
          [1, -1, 0],
        ],
        description: "Detects diagonal state conflicts (TR-BL)",
      },

      // General corner detector (3x3 kernel)
      cornerDetector: {
        kernel: [
          [-1, -1, -1],
          [-1, 8, -1],
          [-1, -1, -1],
        ],
        description: "General corner and edge detector",
      },
    };
  }

  // ============================================================================
  // CONTINUITY KERNELS
  // ============================================================================

  /**
   * Initialize kernels for detecting geometric continuity issues
   */
  initializeContinuityKernels() {
    return {
      // Horizontal continuity kernels
      horizontalContinuity: {
        kernel: [
          [0, 0, 0],
          [1, -2, 1],
          [0, 0, 0],
        ],
        description: "Detects horizontal discontinuities",
      },
      horizontalContinuityStrong: {
        kernel: [
          [0, 0, 0],
          [1, -4, 1],
          [0, 0, 0],
        ],
        description: "Strong horizontal discontinuity detector",
      },

      // Vertical continuity kernels
      verticalContinuity: {
        kernel: [
          [0, 1, 0],
          [0, -2, 0],
          [0, 1, 0],
        ],
        description: "Detects vertical discontinuities",
      },
      verticalContinuityStrong: {
        kernel: [
          [0, 1, 0],
          [0, -4, 0],
          [0, 1, 0],
        ],
        description: "Strong vertical discontinuity detector",
      },

      // Diagonal continuity kernels
      diagonalContinuityTL_BR: {
        kernel: [
          [1, 0, 0],
          [0, -2, 0],
          [0, 0, 1],
        ],
        description: "Detects TL-BR diagonal discontinuities",
      },
      diagonalContinuityTR_BL: {
        kernel: [
          [0, 0, 1],
          [0, -2, 0],
          [1, 0, 0],
        ],
        description: "Detects TR-BL diagonal discontinuities",
      },

      // 8-directional continuity detector
      eightWayContinuity: {
        kernel: [
          [0, 1, 0],
          [1, -8, 1],
          [0, 1, 0],
        ],
        description: "8-directional continuity detector",
      },
    };
  }

  // ============================================================================
  // ZEBRA PATTERN KERNELS
  // ============================================================================

  /**
   * Initialize kernels for detecting zebra patterns (A-B-A alternating patterns)
   */
  initializeZebraKernels() {
    return {
      // Horizontal zebra detection (3x1 kernels)
      horizontalZebra2: {
        kernel: [[1], [-1], [1]],
        description:
          "Detects A-B-A pattern in vertical direction (horizontal zebra)",
      },
      horizontalZebra3: {
        kernel: [[1], [-1], [1], [-1], [1]],
        description: "Detects A-B-A-B-A pattern (longer horizontal zebra)",
      },

      // Vertical zebra detection (1x3 kernels)
      verticalZebra2: {
        kernel: [[1, -1, 1]],
        description:
          "Detects A-B-A pattern in horizontal direction (vertical zebra)",
      },
      verticalZebra3: {
        kernel: [[1, -1, 1, -1, 1]],
        description: "Detects A-B-A-B-A pattern (longer vertical zebra)",
      },

      // Diagonal zebra detection
      diagonalZebraTL_BR: {
        kernel: [
          [1, 0, 0],
          [0, -1, 0],
          [0, 0, 1],
        ],
        description: "Detects zebra pattern along TL-BR diagonal",
      },
      diagonalZebraTR_BL: {
        kernel: [
          [0, 0, 1],
          [0, -1, 0],
          [1, 0, 0],
        ],
        description: "Detects zebra pattern along TR-BL diagonal",
      },

      // State-aware zebra detection (for specific state patterns)
      stateAlternationKernel: {
        kernel: [
          [0.5, -1, 0.5],
          [-1, 2, -1],
          [0.5, -1, 0.5],
        ],
        description: "Detects general state alternation patterns",
      },

      // Diagonal state alternation (specific to diagonal states)
      diagonalAlternationKernel: {
        kernel: [
          [1, 0, -1],
          [0, 0, 0],
          [-1, 0, 1],
        ],
        description: "Detects diagonal state alternation patterns",
      },
    };
  }

  // ============================================================================
  // NEIGHBOR INTERACTION KERNELS
  // ============================================================================

  /**
   * Initialize kernels for detecting neighbor interactions (clustering energy)
   */
  initializeNeighborKernels() {
    return {
      // 8-neighbor sum kernel for counting occupied neighbors
      neighborSum: {
        kernel: [
          [1, 1, 1],
          [1, 0, 1],
          [1, 1, 1],
        ],
        description: "Counts occupied neighbors for interaction energy",
      },
    };
  }

  // ============================================================================
  // CORE KERNEL APPLICATION METHODS
  // ============================================================================

  /**
   * Private method to perform the core convolution calculation
   * @param {Array<Array<number>>} grid - Input grid
   * @param {Array<Array<number>>} kernel - Convolution kernel
   * @param {number} kCenterRow - Kernel center row
   * @param {number} kCenterCol - Kernel center column
   * @param {number} row - Grid row to calculate convolution for
   * @param {number} col - Grid column to calculate convolution for
   * @returns {number} - Convolution response
   */
  #calculateConvolutionResponse(
    grid,
    kernel,
    kCenterRow,
    kCenterCol,
    row,
    col,
  ) {
    const kHeight = kernel.length;
    const kWidth = kernel[0].length;
    let response = 0;
    for (let kr = 0; kr < kHeight; kr++) {
      for (let kc = 0; kc < kWidth; kc++) {
        const gr = row + kr - kCenterRow;
        const gc = col + kc - kCenterCol;

        if (gr >= 0 && gr < this.gridSize && gc >= 0 && gc < this.gridSize) {
          const gridValue = this.getCellGridValue(grid[gr][gc]);
          response += gridValue * kernel[kr][kc];
        }
      }
    }
    return response;
  }

  /**
   * Apply a kernel to a grid with proper boundary handling
   * @param {Array<Array<number>>} grid - Input grid
   * @param {Object} kernelInfo - Kernel object with kernel array and description
   * @param {Object} boundingBox - Optional bounding box {minRow, maxRow, minCol, maxCol}
   * @param {Function} postProcessor - Optional function to post-process convolution response
   *                                    Signature: (response, row, col, grid) => processedValue
   * @returns {Array<Array<number>>} - Convolution result
   */
  applyKernel(grid, kernelInfo, boundingBox = null, postProcessor = null) {
    const kernel = kernelInfo.kernel;
    const kHeight = kernel.length;
    const kWidth = kernel[0].length;
    const kCenterRow = Math.floor(kHeight / 2);
    const kCenterCol = Math.floor(kWidth / 2);

    const result = Array(this.gridSize)
      .fill(null)
      .map(() => Array(this.gridSize).fill(0));

    const {
      minRow = 0,
      maxRow = this.gridSize - 1,
      minCol = 0,
      maxCol = this.gridSize - 1,
    } = boundingBox || {};

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        // reuse the convolution calculation
        const response = this.#calculateConvolutionResponse(
          grid,
          kernel,
          kCenterRow,
          kCenterCol,
          row,
          col,
        );
        // Apply post-processor if provided, otherwise use raw response
        result[row][col] = postProcessor ? postProcessor(response, row, col, grid) : response;
      }
    }

    return result;
  }

  /**
   * Apply a kernel to a grid with absolute value detection
   * This method is specifically designed for detecting patterns that should be penalized
   * regardless of whether they produce positive or negative convolution responses
   * @param {Array<Array<number>>} grid - Input grid
   * @param {Object} kernelInfo - Kernel object with kernel array and description
   * @param {Object} boundingBox - Optional bounding box {minRow, maxRow, minCol, maxCol}
   * @returns {Array<Array<number>>} - Convolution result with absolute values
   */
  applyKernelAbs(grid, kernelInfo, boundingBox = null) {
    return this.applyKernel(
      grid,
      kernelInfo,
      boundingBox,
      Math.abs
    );
  }

  /**
   * Convert cell state to numeric value for kernel processing
   * @param {number} state - Cell state (0-5)
   * @returns {number} - Numeric value for kernel
   */
  getCellGridValue(state) {
    // Map states to appropriate numeric values
    switch (state) {
      case 0:
        return 0; // EMPTY
      case 1:
        return 1; // FULL
      // case 2:
      //   return 0.75; // HALF_DIAG_TL_BR
      // case 3:
      //   return 0.75; // HALF_DIAG_TR_BL
      // case 4:
      //   return 0.75; // HALF_DIAG_BL_TR
      // case 5:
      //   return 0.75; // HALF_DIAG_BR_TL
      default:
        return 0;
    }
  }

  // ============================================================================
  // CORNER DETECTION METHODS
  // ============================================================================

  /**
   * Detect corner patterns using corner kernels
   * @param {Array<Array<number>>} grid - Input grid
   * @param {Object} states - State definitions
   * @param {Object} boundingBox - Optional bounding box {minRow, maxRow, minCol, maxCol}
   * @returns {Object} - Corner detection results
   */
  detectCorners(grid, states, boundingBox = null) {
    const lCorners = this.aggregateKernelResults(
      grid,
      [
        this.cornerKernels.topLeftCorner,
        this.cornerKernels.topRightCorner,
        this.cornerKernels.bottomLeftCorner,
        this.cornerKernels.bottomRightCorner,
      ],
      0.8,
      "L-shaped corners",
      boundingBox,
    );

    const diagonalConflicts = this.aggregateKernelResults(
      grid,
      [
        this.cornerKernels.diagonalConflictTL,
        this.cornerKernels.diagonalConflictTR,
      ],
      0.5,
      "Diagonal conflicts",
      boundingBox,
    );

    const generalCorners = (() => {
      const kernel = this.cornerKernels.cornerDetector;
      const convResult = this.applyKernel(grid, kernel, boundingBox, Math.abs);
      return this.analyzeConvolutionResult(
        convResult,
        1.0,
        "General corners",
        boundingBox,
      );
    })();

    const results = { lCorners, diagonalConflicts, generalCorners };

    // Calculate total corner energy
    const totalScore =
      results.lCorners.score +
      results.diagonalConflicts.score +
      results.generalCorners.score;

    const totalCount =
      results.lCorners.count +
      results.diagonalConflicts.count +
      results.generalCorners.count;

    results.total = {
      score: totalScore,
      count: totalCount,
      average: totalCount > 0 ? totalScore / totalCount : 0,
    };

    return results;
  }

  // ============================================================================
  // CONTINUITY DETECTION METHODS
  // ============================================================================

  /**
   * Detect continuity issues using continuity kernels
   * @param {Array<Array<number>>} grid - Input grid
   * @param {Object} states - State definitions
   * @param {Object} boundingBox - Optional bounding box {minRow, maxRow, minCol, maxCol}
   * @returns {Object} - Continuity detection results
   */
  detectContinuityIssues(grid, states, boundingBox = null) {
    const horizontal = this.aggregateKernelResults(
      grid,
      [
        this.continuityKernels.horizontalContinuity,
        this.continuityKernels.horizontalContinuityStrong,
      ],
      0.6,
      "Horizontal discontinuities",
      boundingBox,
    );

    const vertical = this.aggregateKernelResults(
      grid,
      [
        this.continuityKernels.verticalContinuity,
        this.continuityKernels.verticalContinuityStrong,
      ],
      0.6,
      "Vertical discontinuities",
      boundingBox,
    );

    const diagonal = this.aggregateKernelResults(
      grid,
      [
        this.continuityKernels.diagonalContinuityTL_BR,
        this.continuityKernels.diagonalContinuityTR_BL,
      ],
      0.4,
      "Diagonal discontinuities",
      boundingBox,
    );

    const overall = (() => {
      const kernel = this.continuityKernels.eightWayContinuity;
      const convResult = this.applyKernel(grid, kernel, boundingBox, Math.abs);
      return this.analyzeConvolutionResult(
        convResult,
        0.8,
        "Overall discontinuities",
        boundingBox,
      );
    })();

    const results = { horizontal, vertical, diagonal, overall };

    // Calculate total continuity energy
    const totalScore =
      results.horizontal.score +
      results.vertical.score +
      results.diagonal.score +
      results.overall.score;

    const totalCount =
      results.horizontal.count +
      results.vertical.count +
      results.diagonal.count +
      results.overall.count;

    results.total = {
      score: totalScore,
      count: totalCount,
      average: totalCount > 0 ? totalScore / totalCount : 0,
    };

    return results;
  }

  // ============================================================================
  // ZEBRA PATTERN DETECTION METHODS
  // ============================================================================

  /**
   * Create state-difference grid for zebra pattern detection
   * @param {Array<Array<number>>} grid - Input grid
   * @param {Object} states - State definitions
   * @param {Object} boundingBox - Optional bounding box {minRow, maxRow, minCol, maxCol}
   * @returns {Array<Array<number>>} - State difference grid
   */
  createStateDifferenceGrid(grid, states, boundingBox = null) {
    const diffGrid = Array(this.gridSize)
      .fill(null)
      .map(() => Array(this.gridSize).fill(0));

    const {
      minRow = 0,
      maxRow = this.gridSize - 1,
      minCol = 0,
      maxCol = this.gridSize - 1,
    } = boundingBox || {};

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const currentState = grid[row][col];

        // Check horizontal neighbors for zebra pattern
        if (col > 0 && col < this.gridSize - 1) {
          const leftState = grid[row][col - 1];
          const rightState = grid[row][col + 1];

          // Zebra pattern: different from both neighbors, neighbors similar to each other
          if (leftState === rightState && leftState !== currentState) {
            diffGrid[row][col] = 1; // Zebra center
          }
        }

        // Check vertical neighbors for zebra pattern
        if (row > 0 && row < this.gridSize - 1) {
          const topState = grid[row - 1][col];
          const bottomState = grid[row + 1][col];

          if (topState === bottomState && topState !== currentState) {
            diffGrid[row][col] = Math.max(diffGrid[row][col], 1); // Zebra center
          }
        }
      }
    }

    return diffGrid;
  }

  /**
   * Convert 6-state grid to zebra-suitable numeric grid
   * @param {Array<Array<number>>} grid - Input grid
   * @param {Object} states - State definitions
   * @param {Object} boundingBox - Optional bounding box {minRow, maxRow, minCol, maxCol}
   * @returns {Array<Array<number>>} - Zebra numeric grid
   */
  gridToZebraNumeric(grid, states, boundingBox = null) {
    return grid.map((row) =>
      row.map((state) => {
        // For zebra detection, we care about state differences, not specific values
        if (state === states.EMPTY) return 0;
        if (state === states.FULL) return 1;
        // Group diagonal states for zebra detection
        if (
          state >= states.HALF_DIAG_TL_BR &&
          state <= states.HALF_DIAG_BR_TL
        ) {
          return 0.5; // All diagonal states as intermediate value
        }
        return state; // Fallback
      }),
    );
  }

  /**
   * Detect zebra patterns using all zebra kernels
   * @param {Array<Array<number>>} grid - Input grid
   * @param {Object} states - State definitions
   * @param {Object} boundingBox - Optional bounding box {minRow, maxRow, minCol, maxCol}
   * @returns {Object} - Zebra detection results
   */
  detectZebraPatterns(grid, states, boundingBox = null) {
    const horizontal = this.aggregateKernelResults(
      this.createStateDifferenceGrid(grid, states, boundingBox),
      [this.zebraKernels.horizontalZebra2, this.zebraKernels.horizontalZebra3],
      0.5,
      "Horizontal zebra patterns",
      boundingBox,
    );

    const vertical = this.aggregateKernelResults(
      this.createStateDifferenceGrid(grid, states, boundingBox),
      [this.zebraKernels.verticalZebra2, this.zebraKernels.verticalZebra3],
      0.5,
      "Vertical zebra patterns",
      boundingBox,
    );

    const diagonal = this.aggregateKernelResults(
      this.createStateDifferenceGrid(grid, states, boundingBox),
      [
        this.zebraKernels.diagonalZebraTL_BR,
        this.zebraKernels.diagonalZebraTR_BL,
      ],
      0.3,
      "Diagonal zebra patterns",
      boundingBox,
    );

    const stateSpecific = this.aggregateKernelResults(
      this.gridToZebraNumeric(grid, states, boundingBox),
      [
        this.zebraKernels.stateAlternationKernel,
        this.zebraKernels.diagonalAlternationKernel,
      ],
      0.8,
      "State-specific zebra patterns",
      boundingBox,
    );

    const results = { horizontal, vertical, diagonal, stateSpecific };

    // Calculate total zebra energy
    const totalScore =
      results.horizontal.score +
      results.vertical.score +
      results.diagonal.score +
      results.stateSpecific.score;

    const totalCount =
      results.horizontal.count +
      results.vertical.count +
      results.diagonal.count +
      results.stateSpecific.count;

    results.total = {
      score: totalScore,
      count: totalCount,
      average: totalCount > 0 ? totalScore / totalCount : 0,
    };

    return results;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Aggregate results from multiple kernels
   * @param {Array<Array<number>>} grid - Input grid
   * @param {Array<Object>} kernels - Array of kernel objects
   * @param {number} threshold - Detection threshold
   * @param {string} description - Result description
   * @param {Object} boundingBox - Optional bounding box {minRow, maxRow, minCol, maxCol}
   * @returns {Object} - Aggregated results
   */
  aggregateKernelResults(
    grid,
    kernels,
    threshold,
    description,
    boundingBox = null,
  ) {
    let totalScore = 0;
    let totalCount = 0;
    let maxConvResult = Array(this.gridSize)
      .fill(null)
      .map(() => Array(this.gridSize).fill(0));

    for (const kernelInfo of kernels) {
      const convResult = this.applyKernel(grid, kernelInfo, boundingBox, Math.abs);

      // Keep track of maximum response across all kernels
      const {
        minRow = 0,
        maxRow = this.gridSize - 1,
        minCol = 0,
        maxCol = this.gridSize - 1,
      } = boundingBox || {};

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          maxConvResult[row][col] = Math.max(
            maxConvResult[row][col],
            Math.abs(convResult[row][col]),
          );
        }
      }
    }

    // Count significant responses
    const {
      minRow = 0,
      maxRow = this.gridSize - 1,
      minCol = 0,
      maxCol = this.gridSize - 1,
    } = boundingBox || {};

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (maxConvResult[row][col] > threshold) {
          totalScore += maxConvResult[row][col];
          totalCount++;
        }
      }
    }

    return {
      score: totalScore,
      count: totalCount,
      average: totalCount > 0 ? totalScore / totalCount : 0,
      convolution: maxConvResult,
      description: description,
    };
  }

  /**
   * Analyze convolution result with threshold
   * @param {Array<Array<number>>} convResult - Convolution result
   * @param {number} threshold - Detection threshold
   * @param {string} description - Result description
   * @param {Object} boundingBox - Optional bounding box {minRow, maxRow, minCol, maxCol}
   * @returns {Object} - Analysis results
   */
  analyzeConvolutionResult(
    convResult,
    threshold,
    description,
    boundingBox = null,
  ) {
    let score = 0;
    let count = 0;

    const {
      minRow = 0,
      maxRow = this.gridSize - 1,
      minCol = 0,
      maxCol = this.gridSize - 1,
    } = boundingBox || {};

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const response = convResult[row][col];

        // For hole detection, only penalize positive responses (actual holes)
        // For other detectors, use absolute value as before
        const value = description.includes("Hole")
          ? Math.max(0, response) // Only positive values for holes
          : Math.abs(response); // Absolute value for other features

        if (value > threshold) {
          score += value;
          count++;
        }
      }
    }

    return {
      score: score,
      count: count,
      average: count > 0 ? score / count : 0,
      convolution: convResult,
      description: description,
    };
  }

  /**
   * Calculate total geometric energy excluding directional flow
   * @param {Array<Array<number>>} grid - Input grid
   * @param {Object} states - State definitions
   * @param {Object} weights - Energy weights (without flow)
   * @param {Object} boundingBox - Optional bounding box {minRow, maxRow, minCol, maxCol}
   * @returns {number} - Total geometric energy without flow
   */
  calculateGeometricEnergy(grid, states, weights = {}, boundingBox = null) {
    const defaultWeights = {
      corners: 2.0,
      continuity: 2.5,
      zebra: 2.5,
    };

    const finalWeights = { ...defaultWeights, ...weights };

    // const cornerResults = this.detectCorners(grid, states, boundingBox);
    const continuityResults = this.detectContinuityIssues(
      grid,
      states,
      boundingBox,
    );
    const zebraResults = this.detectZebraPatterns(grid, states, boundingBox);

    let totalEnergy = 0;

    // totalEnergy += cornerResults.total.score * finalWeights.corners;
    totalEnergy += continuityResults.total.score * finalWeights.continuity;
    totalEnergy += zebraResults.total.score * finalWeights.zebra;

    return totalEnergy;
  }

  /**
   * Calculate neighbor interaction energy to penalize isolated cells
   * Uses exponential penalty: isolated cells (fewer neighbors) have higher penalty
   * @param {Array<Array<number>>} grid - Input grid
   * @param {Object} states - State definitions
   * @param {number} scale - Scale parameter for exponential (default 2.0)
   * @param {Object} boundingBox - Optional bounding box {minRow, maxRow, minCol, maxCol}
   * @returns {number} - Total neighbor interaction energy
   */
  calculateNeighborInteractionEnergy(
    grid,
    states,
    scale = 2.0,
    boundingBox = null,
  ) {
    // Post-processor function: applies exponential penalty based on neighbor count
    const postProcessor = (neighborCount, row, col, grid) => {
      // Only apply penalty to occupied cells (not empty cells)
      if (grid[row][col] !== states.EMPTY) {
        // Exponential penalty: exp(-neighborCount / scale)
        // Isolated cells (0-1 neighbors): high penalty (~1.0 - 0.61)
        // Moderately connected (2-4 neighbors): medium penalty (~0.37 - 0.14)
        // Well-connected (5-8 neighbors): low penalty (~0.08 - 0.02)
        return Math.exp(-neighborCount / scale);
      }
      return 0;
    };

    // Apply kernel with exponential post-processor
    const penalties = this.applyKernel(
      grid,
      this.neighborKernels.neighborSum,
      boundingBox,
      postProcessor,
    );

    // Sum all penalty values within bounding box
    let totalEnergy = 0;
    const {
      minRow = 0,
      maxRow = this.gridSize - 1,
      minCol = 0,
      maxCol = this.gridSize - 1,
    } = boundingBox || {};

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        totalEnergy += penalties[row][col];
      }
    }

    return totalEnergy;
  }

  // ============================================================================
  // ISING ENERGY (J1-J2 MODEL)
  // ============================================================================

  /**
   * Convert cell state to spin value for Ising model
   * @param {number} state - Cell state (0-5)
   * @returns {number} - Spin value: -1 (EMPTY), +1 (FULL), 0 (diagonal half-states)
   */
  getSpinValue(state) {
    if (state === 0) return -1; // EMPTY
    if (state === 1) return 1;  // FULL
    return 0; // Diagonal half-states (2-5) are ignored
  }

  /**
   * Calculate J1-J2 Ising energy for ferromagnetic coupling
   * Energy formula: E = -J1 * Σ(s_i * s_j)_nn - J2 * Σ(s_i * s_j)_nnn
   * where nn = nearest neighbors (4-connected), nnn = next-nearest neighbors (diagonals)
   * 
   * @param {Array<Array<number>>} grid - Input grid
   * @param {Object} states - State definitions
   * @param {number} J1 - Nearest neighbor coupling constant (default 1.0)
   * @param {number} J2 - Next-nearest neighbor coupling constant (default 1.0)
   * @param {Object} boundingBox - Optional bounding box {minRow, maxRow, minCol, maxCol}
   * @returns {number} - Total Ising energy
   */
  calculateIsingEnergy(
    grid,
    states,
    J1 = 1.0,
    J2 = 1.0,
    boundingBox = null,
  ) {
    const {
      minRow = 0,
      maxRow = this.gridSize - 1,
      minCol = 0,
      maxCol = this.gridSize - 1,
    } = boundingBox || {};

    // Nearest neighbor directions (J1: up, down, left, right)
    const j1Directions = [
      [-1, 0],  // up
      [1, 0],   // down
      [0, -1],  // left
      [0, 1],   // right
    ];

    // Next-nearest neighbor directions (J2: diagonals)
    const j2Directions = [
      [-1, -1], // top-left
      [-1, 1],  // top-right
      [1, -1],  // bottom-left
      [1, 1],   // bottom-right
    ];

    let totalEnergy = 0;

    // Iterate through all cells in bounding box
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const spinI = this.getSpinValue(grid[row][col]);
        
        // Skip cells with spin = 0 (diagonal half-states)
        if (spinI === 0) continue;

        // Calculate J1 interactions (nearest neighbors)
        for (const [dr, dc] of j1Directions) {
          const neighborRow = row + dr;
          const neighborCol = col + dc;

          // Check if neighbor is within grid bounds
          if (
            neighborRow >= 0 &&
            neighborRow < this.gridSize &&
            neighborCol >= 0 &&
            neighborCol < this.gridSize
          ) {
            const spinJ = this.getSpinValue(grid[neighborRow][neighborCol]);
            
            // Only count interaction if neighbor spin is non-zero
            if (spinJ !== 0) {
              totalEnergy += -J1 * spinI * spinJ;
            }
          }
        }

        // Calculate J2 interactions (next-nearest neighbors)
        for (const [dr, dc] of j2Directions) {
          const neighborRow = row + dr;
          const neighborCol = col + dc;

          // Check if neighbor is within grid bounds
          if (
            neighborRow >= 0 &&
            neighborRow < this.gridSize &&
            neighborCol >= 0 &&
            neighborCol < this.gridSize
          ) {
            const spinJ = this.getSpinValue(grid[neighborRow][neighborCol]);
            
            // Only count interaction if neighbor spin is non-zero
            if (spinJ !== 0) {
              totalEnergy += -J2 * spinI * spinJ;
            }
          }
        }
      }
    }

    // Divide by 2 to avoid double-counting pairs
    return totalEnergy / 2.0;
  }

  /**
   * Calculate local Ising energy change for a single cell state change
   * This is much more efficient than recalculating the entire region
   * 
   * @param {Array<Array<number>>} grid - Input grid
   * @param {Object} states - State definitions
   * @param {number} row - Row of cell being changed
   * @param {number} col - Column of cell being changed
   * @param {number} oldState - Old state of the cell
   * @param {number} newState - New state of the cell
   * @param {number} J1 - Nearest neighbor coupling constant
   * @param {number} J2 - Next-nearest neighbor coupling constant
   * @returns {number} - Energy change (ΔE)
   */
  calculateLocalIsingChange(
    grid,
    states,
    row,
    col,
    oldState,
    newState,
    J1 = 1.0,
    J2 = 1.0,
  ) {
    const oldSpin = this.getSpinValue(oldState);
    const newSpin = this.getSpinValue(newState);
    const deltaSpin = newSpin - oldSpin;

    // If spin doesn't change, no energy change
    if (deltaSpin === 0) return 0;

    // Nearest neighbor directions (J1)
    const j1Directions = [
      [-1, 0],  // up
      [1, 0],   // down
      [0, -1],  // left
      [0, 1],   // right
    ];

    // Next-nearest neighbor directions (J2)
    const j2Directions = [
      [-1, -1], // top-left
      [-1, 1],  // top-right
      [1, -1],  // bottom-left
      [1, 1],   // bottom-right
    ];

    let deltaEnergy = 0;

    // Calculate J1 contribution
    for (const [dr, dc] of j1Directions) {
      const neighborRow = row + dr;
      const neighborCol = col + dc;

      if (
        neighborRow >= 0 &&
        neighborRow < this.gridSize &&
        neighborCol >= 0 &&
        neighborCol < this.gridSize
      ) {
        const neighborSpin = this.getSpinValue(grid[neighborRow][neighborCol]);
        if (neighborSpin !== 0) {
          // ΔE = -J1 * (newSpin * s_j - oldSpin * s_j) = -J1 * Δspin * s_j
          deltaEnergy += -J1 * deltaSpin * neighborSpin;
        }
      }
    }

    // Calculate J2 contribution
    for (const [dr, dc] of j2Directions) {
      const neighborRow = row + dr;
      const neighborCol = col + dc;

      if (
        neighborRow >= 0 &&
        neighborRow < this.gridSize &&
        neighborCol >= 0 &&
        neighborCol < this.gridSize
      ) {
        const neighborSpin = this.getSpinValue(grid[neighborRow][neighborCol]);
        if (neighborSpin !== 0) {
          deltaEnergy += -J2 * deltaSpin * neighborSpin;
        }
      }
    }

    return deltaEnergy;
  }

  /**
   * Calculate Ising energy change for a swap between two cells
   * Handles the special case when swapped cells are J1 or J2 neighbors
   * 
   * @param {Array<Array<number>>} grid - Input grid
   * @param {Object} states - State definitions
   * @param {Object} cell1 - First cell {row, col}
   * @param {Object} cell2 - Second cell {row, col}
   * @param {number} state1 - Current state of cell1
   * @param {number} state2 - Current state of cell2
   * @param {number} J1 - Nearest neighbor coupling constant
   * @param {number} J2 - Next-nearest neighbor coupling constant
   * @returns {number} - Total energy change for the swap
   */
  calculateIsingSwapEnergy(
    grid,
    states,
    cell1,
    cell2,
    state1,
    state2,
    J1 = 1.0,
    J2 = 1.0,
  ) {
    // Calculate local energy change at each cell
    let deltaEnergy = 0;

    // Energy change at cell1 (changing from state1 to state2)
    deltaEnergy += this.calculateLocalIsingChange(
      grid, states, cell1.row, cell1.col, state1, state2, J1, J2
    );

    // Energy change at cell2 (changing from state2 to state1)
    deltaEnergy += this.calculateLocalIsingChange(
      grid, states, cell2.row, cell2.col, state2, state1, J1, J2
    );

    // Check if cells are J1 or J2 neighbors - if so, adjust for mutual interaction
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);

    const spin1 = this.getSpinValue(state1);
    const spin2 = this.getSpinValue(state2);

    // Only adjust if both spins are non-zero
    if (spin1 !== 0 && spin2 !== 0) {
      // Check if they are J1 neighbors (Manhattan distance = 1, not diagonal)
      if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        // They are J1 neighbors
        // Before swap: -J1 * spin1 * spin2
        // After swap:  -J1 * spin2 * spin1 (same)
        // But we double-counted this interaction in local changes
        // Need to subtract the double-counted contribution
        const oldInteraction = -J1 * spin1 * spin2;
        const newInteraction = -J1 * spin2 * spin1; // Same value
        // We counted this twice (once from cell1, once from cell2), but it should be 0 change
        deltaEnergy -= (newInteraction - oldInteraction); // This is 0, but explicit for clarity
      }
      // Check if they are J2 neighbors (diagonal neighbors)
      else if (rowDiff === 1 && colDiff === 1) {
        // They are J2 neighbors
        const oldInteraction = -J2 * spin1 * spin2;
        const newInteraction = -J2 * spin2 * spin1; // Same value
        deltaEnergy -= (newInteraction - oldInteraction); // This is 0
      }
    }

    return deltaEnergy;
  }

  /**
   * Get all kernels organized by category
   * @returns {Object} - All kernels organized by type
   */
  getAllKernels() {
    return {
      corners: this.cornerKernels,
      continuity: this.continuityKernels,
      zebra: this.zebraKernels,
      neighbor: this.neighborKernels,
    };
  }

  /**
   * Update the grid size and reinitialize arrays
   * @param {number} newSize - New grid size
   */
  updateGridSize(newSize) {
    this.gridSize = newSize;
    this.log(`Grid size updated to ${newSize}`);
  }

  /**
   * Logging function
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (this.debugMode) {
      console.log("[GeometricKernels]", ...args);
    }
  }
}
