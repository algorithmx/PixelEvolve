// Zebra Pattern Detection Kernels for 6-State System

export class ZebraKernels {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.debugMode = false;

        // Zebra detection kernels
        this.kernels = this.initializeKernels();

        this.log('Zebra kernels initialized');
    }

    // Initialize all zebra detection kernels
    initializeKernels() {
        return {
            // Horizontal zebra detection (3x1 kernels)
            horizontalZebra2: {
                kernel: [
                    [1],
                    [-1],
                    [1]
                ],
                description: "Detects A-B-A pattern in vertical direction (horizontal zebra)"
            },
            horizontalZebra3: {
                kernel: [
                    [1],
                    [-1],
                    [1],
                    [-1],
                    [1]
                ],
                description: "Detects A-B-A-B-A pattern (longer horizontal zebra)"
            },

            // Vertical zebra detection (1x3 kernels)
            verticalZebra2: {
                kernel: [
                    [1, -1, 1]
                ],
                description: "Detects A-B-A pattern in horizontal direction (vertical zebra)"
            },
            verticalZebra3: {
                kernel: [
                    [1, -1, 1, -1, 1]
                ],
                description: "Detects A-B-A-B-A pattern (longer vertical zebra)"
            },

            // Diagonal zebra detection
            diagonalZebraTL_BR: {
                kernel: [
                    [1, 0, 0],
                    [0, -1, 0],
                    [0, 0, 1]
                ],
                description: "Detects zebra pattern along TL-BR diagonal"
            },
            diagonalZebraTR_BL: {
                kernel: [
                    [0, 0, 1],
                    [0, -1, 0],
                    [1, 0, 0]
                ],
                description: "Detects zebra pattern along TR-BL diagonal"
            },

            // State-aware zebra detection (for specific state patterns)
            stateAlternationKernel: {
                kernel: [
                    [0.5, -1, 0.5],
                    [-1, 2, -1],
                    [0.5, -1, 0.5]
                ],
                description: "Detects general state alternation patterns"
            },

            // Diagonal state alternation (specific to diagonal states)
            diagonalAlternationKernel: {
                kernel: [
                    [1, 0, -1],
                    [0, 0, 0],
                    [-1, 0, 1]
                ],
                description: "Detects diagonal state alternation patterns"
            }
        };
    }

    // Convert 6-state grid to zebra-suitable numeric grid
    gridToZebraNumeric(grid, states) {
        return grid.map(row =>
            row.map(state => {
                // For zebra detection, we care about state differences, not specific values
                if (state === states.EMPTY) return 0;
                if (state === states.FULL) return 1;
                // Group diagonal states for zebra detection
                if (state >= states.HALF_DIAG_TL_BR && state <= states.HALF_DIAG_BR_TL) {
                    return 0.5; // All diagonal states as intermediate value
                }
                return state; // Fallback
            })
        );
    }

    // Create state-difference grid for better zebra detection
    createStateDifferenceGrid(grid, states) {
        const diffGrid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
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

    // Apply kernel to grid with zebra-specific logic
    applyZebraKernel(grid, kernelInfo, normalize = true) {
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
                            response += grid[gr][gc] * kernel[kr][kc];
                            validCells++;
                        }
                    }
                }

                // Zebra-specific normalization
                if (normalize && validCells > 0) {
                    // For zebra detection, we want to emphasize alternating patterns
                    // Take absolute value to detect any alternating pattern
                    result[row][col] = Math.abs(response) / Math.sqrt(validCells);
                } else {
                    result[row][col] = response;
                }
            }
        }

        return result;
    }

    // Detect horizontal zebra patterns
    detectHorizontalZebra(grid, states) {
        const zebraGrid = this.createStateDifferenceGrid(grid, states);
        const horizontalKernel = this.kernels.horizontalZebra2;
        const convResult = this.applyZebraKernel(zebraGrid, horizontalKernel);

        let zebraScore = 0;
        let zebraCount = 0;

        // Count strong zebra responses
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (convResult[row][col] > 0.5) { // Threshold for zebra detection
                    zebraScore += convResult[row][col];
                    zebraCount++;
                }
            }
        }

        return {
            score: zebraScore,
            count: zebraCount,
            average: zebraCount > 0 ? zebraScore / zebraCount : 0,
            convolution: convResult,
            description: "Horizontal zebra patterns (A-B-A)"
        };
    }

    // Detect vertical zebra patterns
    detectVerticalZebra(grid, states) {
        const zebraGrid = this.createStateDifferenceGrid(grid, states);
        const verticalKernel = this.kernels.verticalZebra2;
        const convResult = this.applyZebraKernel(zebraGrid, verticalKernel);

        let zebraScore = 0;
        let zebraCount = 0;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (convResult[row][col] > 0.5) {
                    zebraScore += convResult[row][col];
                    zebraCount++;
                }
            }
        }

        return {
            score: zebraScore,
            count: zebraCount,
            average: zebraCount > 0 ? zebraScore / zebraCount : 0,
            convolution: convResult,
            description: "Vertical zebra patterns (A-B-A)"
        };
    }

    // Detect diagonal zebra patterns
    detectDiagonalZebra(grid, states) {
        const zebraGrid = this.createStateDifferenceGrid(grid, states);
        const diagonalKernel = this.kernels.diagonalZebraTL_BR;
        const convResult = this.applyZebraKernel(zebraGrid, diagonalKernel);

        let zebraScore = 0;
        let zebraCount = 0;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (convResult[row][col] > 0.3) { // Lower threshold for diagonal patterns
                    zebraScore += convResult[row][col];
                    zebraCount++;
                }
            }
        }

        return {
            score: zebraScore,
            count: zebraCount,
            average: zebraCount > 0 ? zebraScore / zebraCount : 0,
            convolution: convResult,
            description: "Diagonal zebra patterns"
        };
    }

    // Detect state-specific zebra patterns (for diagonal states)
    detectStateSpecificZebra(grid, states) {
        const stateGrid = this.gridToZebraNumeric(grid, states);
        const stateKernel = this.kernels.stateAlternationKernel;
        const convResult = this.applyZebraKernel(stateGrid, stateKernel);

        let zebraScore = 0;
        let zebraCount = 0;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (convResult[row][col] > 0.8) {
                    zebraScore += convResult[row][col];
                    zebraCount++;
                }
            }
        }

        return {
            score: zebraScore,
            count: zebraCount,
            average: zebraCount > 0 ? zebraScore / zebraCount : 0,
            convolution: convResult,
            description: "State-specific zebra patterns"
        };
    }

    // Comprehensive zebra detection using all kernels
    detectAllZebraPatterns(grid, states) {
        const results = {
            horizontal: this.detectHorizontalZebra(grid, states),
            vertical: this.detectVerticalZebra(grid, states),
            diagonal: this.detectDiagonalZebra(grid, states),
            stateSpecific: this.detectStateSpecificZebra(grid, states)
        };

        // Calculate total zebra energy
        const totalScore = results.horizontal.score +
                          results.vertical.score +
                          results.diagonal.score +
                          results.stateSpecific.score;

        const totalCount = results.horizontal.count +
                          results.vertical.count +
                          results.diagonal.count +
                          results.stateSpecific.count;

        results.total = {
            score: totalScore,
            count: totalCount,
            average: totalCount > 0 ? totalScore / totalCount : 0
        };

        this.log('Zebra detection results:', {
            horizontal: results.horizontal.average.toFixed(3),
            vertical: results.vertical.average.toFixed(3),
            diagonal: results.diagonal.average.toFixed(3),
            stateSpecific: results.stateSpecific.average.toFixed(3),
            total: results.total.average.toFixed(3)
        });

        return results;
    }

    // Calculate zebra penalty energy for the grid
    calculateZebraEnergy(grid, states, weight = 1.0) {
        const zebraResults = this.detectAllZebraPatterns(grid, states);

        // Different penalties for different zebra types
        const penalties = {
            horizontal: 1.0,  // Most common zebra pattern
            vertical: 1.2,    // Slightly less common
            diagonal: 0.8,    // More natural in diagonal states
            stateSpecific: 1.5 // Most undesirable
        };

        let totalPenalty = 0;
        totalPenalty += zebraResults.horizontal.score * penalties.horizontal;
        totalPenalty += zebraResults.vertical.score * penalties.vertical;
        totalPenalty += zebraResults.diagonal.score * penalties.diagonal;
        totalPenalty += zebraResults.stateSpecific.score * penalties.stateSpecific;

        // Normalize by grid size
        totalPenalty = totalPenalty / (this.gridSize * this.gridSize);

        return totalPenalty * weight;
    }

    // Visualize zebra patterns (for debugging)
    visualizeZebraPatterns(grid, states) {
        const zebraResults = this.detectAllZebraPatterns(grid, states);
        const visualization = [];

        // Create a combined zebra visualization
        const combined = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                let maxResponse = 0;
                let maxType = 'none';

                if (zebraResults.horizontal.convolution[row][col] > maxResponse) {
                    maxResponse = zebraResults.horizontal.convolution[row][col];
                    maxType = 'H';
                }
                if (zebraResults.vertical.convolution[row][col] > maxResponse) {
                    maxResponse = zebraResults.vertical.convolution[row][col];
                    maxType = 'V';
                }
                if (zebraResults.diagonal.convolution[row][col] > maxResponse) {
                    maxResponse = zebraResults.diagonal.convolution[row][col];
                    maxType = 'D';
                }
                if (zebraResults.stateSpecific.convolution[row][col] > maxResponse) {
                    maxResponse = zebraResults.stateSpecific.convolution[row][col];
                    maxType = 'S';
                }

                combined[row][col] = maxResponse > 0.5 ? maxType : '.';
            }
        }

        return {
            combined,
            results: zebraResults
        };
    }

    log(...args) {
        if (this.debugMode) {
            console.log('[ZebraKernels]', ...args);
        }
    }
}