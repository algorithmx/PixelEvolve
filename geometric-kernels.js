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
        this.flowKernels = this.initializeFlowKernels();

        this.log('Geometric kernels initialized');
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
                    [ 2, -1,  0],
                    [-1,  1,  0],
                    [ 0,  0,  0]
                ],
                description: "Detects top-left L-shaped corners"
            },
            topRightCorner: {
                kernel: [
                    [ 0, -1,  2],
                    [ 0,  1, -1],
                    [ 0,  0,  0]
                ],
                description: "Detects top-right L-shaped corners"
            },
            bottomLeftCorner: {
                kernel: [
                    [ 0,  0,  0],
                    [-1,  1,  0],
                    [ 2, -1,  0]
                ],
                description: "Detects bottom-left L-shaped corners"
            },
            bottomRightCorner: {
                kernel: [
                    [ 0,  0,  0],
                    [ 0,  1, -1],
                    [ 0, -1,  2]
                ],
                description: "Detects bottom-right L-shaped corners"
            },

            // Diagonal conflict detectors (3x3 kernels)
            diagonalConflictTL: {
                kernel: [
                    [ 0,  1,  0],
                    [ 1, -2, -1],
                    [ 0, -1,  1]
                ],
                description: "Detects diagonal state conflicts (TL-BR)"
            },
            diagonalConflictTR: {
                kernel: [
                    [ 0,  1,  0],
                    [-1, -2,  1],
                    [ 1, -1,  0]
                ],
                description: "Detects diagonal state conflicts (TR-BL)"
            },

            // General corner detector (3x3 kernel)
            cornerDetector: {
                kernel: [
                    [-1, -1, -1],
                    [-1,  8, -1],
                    [-1, -1, -1]
                ],
                description: "General corner and edge detector"
            }
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
                    [0, 0, 0]
                ],
                description: "Detects horizontal discontinuities"
            },
            horizontalContinuityStrong: {
                kernel: [
                    [ 0,  0,  0],
                    [ 1, -4,  1],
                    [ 0,  0,  0]
                ],
                description: "Strong horizontal discontinuity detector"
            },

            // Vertical continuity kernels
            verticalContinuity: {
                kernel: [
                    [0, 1, 0],
                    [0, -2, 0],
                    [0, 1, 0]
                ],
                description: "Detects vertical discontinuities"
            },
            verticalContinuityStrong: {
                kernel: [
                    [ 0,  1,  0],
                    [ 0, -4,  0],
                    [ 0,  1,  0]
                ],
                description: "Strong vertical discontinuity detector"
            },

            // Diagonal continuity kernels
            diagonalContinuityTL_BR: {
                kernel: [
                    [ 1,  0,  0],
                    [ 0, -2,  0],
                    [ 0,  0,  1]
                ],
                description: "Detects TL-BR diagonal discontinuities"
            },
            diagonalContinuityTR_BL: {
                kernel: [
                    [ 0,  0,  1],
                    [ 0, -2,  0],
                    [ 1,  0,  0]
                ],
                description: "Detects TR-BL diagonal discontinuities"
            },

            // 8-directional continuity detector
            eightWayContinuity: {
                kernel: [
                    [ 0,  1,  0],
                    [ 1, -8,  1],
                    [ 0,  1,  0]
                ],
                description: "8-directional continuity detector"
            }
        };
    }

    // ============================================================================
    // DIRECTIONAL FLOW KERNELS
    // ============================================================================

    /**
     * Initialize kernels for detecting directional flow consistency
     */
    initializeFlowKernels() {
        return {
            // TL-BR directional flow kernels
            flowTL_BR: {
                kernel: [
                    [ 0, -1,  1],
                    [-1,  0,  2],
                    [ 1,  2,  0]
                ],
                description: "Detects TL-BR directional flow patterns"
            },
            flowTL_BR_anti: {
                kernel: [
                    [ 1,  2,  0],
                    [-1,  0,  2],
                    [ 0, -1,  1]
                ],
                description: "Anti-TL-BR flow (detects opposite patterns)"
            },

            // TR-BL directional flow kernels
            flowTR_BL: {
                kernel: [
                    [ 1, -1,  0],
                    [ 2,  0, -1],
                    [ 0,  2,  1]
                ],
                description: "Detects TR-BL directional flow patterns"
            },
            flowTR_BL_anti: {
                kernel: [
                    [ 0,  2,  1],
                    [ 2,  0, -1],
                    [ 1, -1,  0]
                ],
                description: "Anti-TR-BL flow (detects opposite patterns)"
            },

            // Circular flow detector
            circularFlow: {
                kernel: [
                    [ 0,  1,  0],
                    [-1,  0,  1],
                    [ 0, -1,  0]
                ],
                description: "Detects circular flow patterns"
            },

            // Flow consistency kernels
            flowConsistency3x3: {
                kernel: [
                    [ 1,  0, -1],
                    [ 0,  0,  0],
                    [-1,  0,  1]
                ],
                description: "3x3 flow consistency detector"
            },
            flowConsistency5x5: {
                kernel: [
                    [ 0,  0,  1,  0,  0],
                    [ 0,  1,  0, -1,  0],
                    [ 1,  0, -4,  0,  1],
                    [ 0, -1,  0,  1,  0],
                    [ 0,  0,  1,  0,  0]
                ],
                description: "5x5 flow consistency detector"
            }
        };
    }

    // ============================================================================
    // CORE KERNEL APPLICATION METHODS
    // ============================================================================

    /**
     * Apply a kernel to a grid with proper boundary handling
     * @param {Array<Array<number>>} grid - Input grid
     * @param {Object} kernelInfo - Kernel object with kernel array and description
     * @param {boolean} normalize - Whether to normalize the result
     * @returns {Array<Array<number>>} - Convolution result
     */
    applyKernel(grid, kernelInfo, normalize = true) {
        const kernel = kernelInfo.kernel;
        const kHeight = kernel.length;
        const kWidth = kernel[0].length;
        const kCenterRow = Math.floor(kHeight / 2);
        const kCenterCol = Math.floor(kWidth / 2);

        const result = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                let response = 0;
                let validCells = 0;

                for (let kr = 0; kr < kHeight; kr++) {
                    for (let kc = 0; kc < kWidth; kc++) {
                        const gr = row + kr - kCenterRow;
                        const gc = col + kc - kCenterCol;

                        if (gr >= 0 && gr < this.gridSize && gc >= 0 && gc < this.gridSize) {
                            const gridValue = this.getCellGridValue(grid[gr][gc]);
                            response += gridValue * kernel[kr][kc];
                            validCells++;
                        }
                    }
                }

                // Normalize if requested
                if (normalize && validCells > 0) {
                    result[row][col] = response / Math.sqrt(validCells);
                } else {
                    result[row][col] = response;
                }
            }
        }

        return result;
    }

    /**
     * Convert cell state to numeric value for kernel processing
     * @param {number} state - Cell state (0-5)
     * @returns {number} - Numeric value for kernel
     */
    getCellGridValue(state) {
        // Map states to appropriate numeric values
        switch(state) {
            case 0: return 0;  // EMPTY
            case 1: return 1;  // FULL
            case 2: return 0.75; // HALF_DIAG_TL_BR
            case 3: return 0.75; // HALF_DIAG_TR_BL
            case 4: return 0.75; // HALF_DIAG_BL_TR
            case 5: return 0.75; // HALF_DIAG_BR_TL
            default: return 0;
        }
    }

    // ============================================================================
    // CORNER DETECTION METHODS
    // ============================================================================

    /**
     * Detect corner patterns using corner kernels
     * @param {Array<Array<number>>} grid - Input grid
     * @param {Object} states - State definitions
     * @returns {Object} - Corner detection results
     */
    detectCorners(grid, states) {
        const results = {
            lCorners: this.detectLCorners(grid, states),
            diagonalConflicts: this.detectDiagonalConflicts(grid, states),
            generalCorners: this.detectGeneralCorners(grid, states)
        };

        // Calculate total corner energy
        const totalScore = results.lCorners.score +
                          results.diagonalConflicts.score +
                          results.generalCorners.score;

        const totalCount = results.lCorners.count +
                          results.diagonalConflicts.count +
                          results.generalCorners.count;

        results.total = {
            score: totalScore,
            count: totalCount,
            average: totalCount > 0 ? totalScore / totalCount : 0
        };

        return results;
    }

    detectLCorners(grid, states) {
        const kernels = [
            this.cornerKernels.topLeftCorner,
            this.cornerKernels.topRightCorner,
            this.cornerKernels.bottomLeftCorner,
            this.cornerKernels.bottomRightCorner
        ];

        return this.aggregateKernelResults(grid, kernels, 0.8, "L-shaped corners");
    }

    detectDiagonalConflicts(grid, states) {
        const kernels = [
            this.cornerKernels.diagonalConflictTL,
            this.cornerKernels.diagonalConflictTR
        ];

        return this.aggregateKernelResults(grid, kernels, 0.5, "Diagonal conflicts");
    }

    detectGeneralCorners(grid, states) {
        const kernel = this.cornerKernels.cornerDetector;
        const convResult = this.applyKernel(grid, kernel);

        return this.analyzeConvolutionResult(convResult, 1.0, "General corners");
    }

    // ============================================================================
    // CONTINUITY DETECTION METHODS
    // ============================================================================

    /**
     * Detect continuity issues using continuity kernels
     * @param {Array<Array<number>>} grid - Input grid
     * @param {Object} states - State definitions
     * @returns {Object} - Continuity detection results
     */
    detectContinuityIssues(grid, states) {
        const results = {
            horizontal: this.detectHorizontalContinuity(grid, states),
            vertical: this.detectVerticalContinuity(grid, states),
            diagonal: this.detectDiagonalContinuity(grid, states),
            overall: this.detectOverallContinuity(grid, states)
        };

        // Calculate total continuity energy
        const totalScore = results.horizontal.score +
                          results.vertical.score +
                          results.diagonal.score +
                          results.overall.score;

        const totalCount = results.horizontal.count +
                          results.vertical.count +
                          results.diagonal.count +
                          results.overall.count;

        results.total = {
            score: totalScore,
            count: totalCount,
            average: totalCount > 0 ? totalScore / totalCount : 0
        };

        return results;
    }

    detectHorizontalContinuity(grid, states) {
        const kernels = [
            this.continuityKernels.horizontalContinuity,
            this.continuityKernels.horizontalContinuityStrong
        ];

        return this.aggregateKernelResults(grid, kernels, 0.6, "Horizontal discontinuities");
    }

    detectVerticalContinuity(grid, states) {
        const kernels = [
            this.continuityKernels.verticalContinuity,
            this.continuityKernels.verticalContinuityStrong
        ];

        return this.aggregateKernelResults(grid, kernels, 0.6, "Vertical discontinuities");
    }

    detectDiagonalContinuity(grid, states) {
        const kernels = [
            this.continuityKernels.diagonalContinuityTL_BR,
            this.continuityKernels.diagonalContinuityTR_BL
        ];

        return this.aggregateKernelResults(grid, kernels, 0.4, "Diagonal discontinuities");
    }

    detectOverallContinuity(grid, states) {
        const kernel = this.continuityKernels.eightWayContinuity;
        const convResult = this.applyKernel(grid, kernel);

        return this.analyzeConvolutionResult(convResult, 0.8, "Overall discontinuities");
    }

    // ============================================================================
    // FLOW DETECTION METHODS
    // ============================================================================

    /**
     * Detect directional flow inconsistencies using flow kernels
     * @param {Array<Array<number>>} grid - Input grid
     * @param {Object} states - State definitions
     * @returns {Object} - Flow detection results
     */
    detectFlowInconsistencies(grid, states) {
        const results = {
            tl_br: this.detectTL_BRFlow(grid, states),
            tr_bl: this.detectTR_BLFlow(grid, states),
            circular: this.detectCircularFlow(grid, states),
            consistency: this.detectFlowConsistency(grid, states)
        };

        // Calculate total flow energy
        const totalScore = results.tl_br.score +
                          results.tr_bl.score +
                          results.circular.score +
                          results.consistency.score;

        const totalCount = results.tl_br.count +
                          results.tr_bl.count +
                          results.circular.count +
                          results.consistency.count;

        results.total = {
            score: totalScore,
            count: totalCount,
            average: totalCount > 0 ? totalScore / totalCount : 0
        };

        return results;
    }

    detectTL_BRFlow(grid, states) {
        const kernels = [
            this.flowKernels.flowTL_BR,
            this.flowKernels.flowTL_BR_anti
        ];

        return this.aggregateKernelResults(grid, kernels, 0.5, "TL-BR flow issues");
    }

    detectTR_BLFlow(grid, states) {
        const kernels = [
            this.flowKernels.flowTR_BL,
            this.flowKernels.flowTR_BL_anti
        ];

        return this.aggregateKernelResults(grid, kernels, 0.5, "TR-BL flow issues");
    }

    detectCircularFlow(grid, states) {
        const kernel = this.flowKernels.circularFlow;
        const convResult = this.applyKernel(grid, kernel);

        return this.analyzeConvolutionResult(convResult, 0.4, "Circular flow patterns");
    }

    detectFlowConsistency(grid, states) {
        const kernels = [
            this.flowKernels.flowConsistency3x3,
            this.flowKernels.flowConsistency5x5
        ];

        return this.aggregateKernelResults(grid, kernels, 0.6, "Flow inconsistencies");
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
     * @returns {Object} - Aggregated results
     */
    aggregateKernelResults(grid, kernels, threshold, description) {
        let totalScore = 0;
        let totalCount = 0;
        let maxConvResult = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));

        for (const kernelInfo of kernels) {
            const convResult = this.applyKernel(grid, kernelInfo);

            // Keep track of maximum response across all kernels
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    maxConvResult[row][col] = Math.max(maxConvResult[row][col], Math.abs(convResult[row][col]));
                }
            }
        }

        // Count significant responses
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
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
            description: description
        };
    }

    /**
     * Analyze convolution result with threshold
     * @param {Array<Array<number>>} convResult - Convolution result
     * @param {number} threshold - Detection threshold
     * @param {string} description - Result description
     * @returns {Object} - Analysis results
     */
    analyzeConvolutionResult(convResult, threshold, description) {
        let score = 0;
        let count = 0;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (Math.abs(convResult[row][col]) > threshold) {
                    score += Math.abs(convResult[row][col]);
                    count++;
                }
            }
        }

        return {
            score: score,
            count: count,
            average: count > 0 ? score / count : 0,
            convolution: convResult,
            description: description
        };
    }

    /**
     * Calculate total geometric energy using all kernel systems
     * @param {Array<Array<number>>} grid - Input grid
     * @param {Object} states - State definitions
     * @param {Object} weights - Energy weights
     * @returns {number} - Total geometric energy
     */
    calculateGeometricEnergy(grid, states, weights = {}) {
        const defaultWeights = {
            corners: 2.0,
            continuity: 2.5,
            flow: 1.8
        };

        const finalWeights = { ...defaultWeights, ...weights };

        const cornerResults = this.detectCorners(grid, states);
        const continuityResults = this.detectContinuityIssues(grid, states);
        const flowResults = this.detectFlowInconsistencies(grid, states);

        let totalEnergy = 0;

        totalEnergy += cornerResults.total.score * finalWeights.corners;
        totalEnergy += continuityResults.total.score * finalWeights.continuity;
        totalEnergy += flowResults.total.score * finalWeights.flow;

        // Normalize by grid size
        totalEnergy = totalEnergy / (this.gridSize * this.gridSize);

        return totalEnergy;
    }

    /**
     * Get all kernels organized by category
     * @returns {Object} - All kernels organized by type
     */
    getAllKernels() {
        return {
            corners: this.cornerKernels,
            continuity: this.continuityKernels,
            flow: this.flowKernels
        };
    }

    /**
     * Logging function
     * @param {...any} args - Arguments to log
     */
    log(...args) {
        if (this.debugMode) {
            console.log('[GeometricKernels]', ...args);
        }
    }
}