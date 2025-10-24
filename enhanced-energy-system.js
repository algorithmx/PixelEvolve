// Enhanced Energy System - 6-State Aware Convolution Kernels

import { ZebraKernels } from './zebra-kernels.js';

export class EnhancedEnergySystem {
    constructor(gridSize, config = {}) {
        this.gridSize = gridSize;
        this.config = config;
        this.debugMode = config.debugMode || false;

        // State definitions for reference
        this.STATES = {
            EMPTY: 0,
            FULL: 1,
            HALF_DIAG_TL_BR: 2,  // Top-left to bottom-right
            HALF_DIAG_TR_BL: 3,  // Top-right to bottom-left
            HALF_DIAG_BL_TR: 4,  // Bottom-left to top-right
            HALF_DIAG_BR_TL: 5   // Bottom-right to top-left
        };

        // Energy weights for 6-state system
        this.energyWeights = {
            geometricContinuity: 2.5,    // Smooth geometric connections
            directionalFlow: 1.8,        // Directional pattern consistency
            sharpCorners: 2.0,           // Sharp geometric corners
            incompatibleConnections: 3.0, // State incompatibility penalties
            zebraPatterns: 2.5,          // Kernel-based zebra pattern penalties
            areaConstraint: 2.5          // Target area maintenance
        };

        // Initialize zebra detection kernels
        this.zebraKernels = new ZebraKernels(gridSize, { debugMode: this.debugMode });

        this.log('Enhanced energy system initialized with kernel-based zebra detection');
    }

    // State compatibility matrix - how well different states connect
    getStateCompatibility(state1, state2) {
        // Returns compatibility score: 1.0 = perfect, 0.0 = incompatible
        if (state1 === state2) return 1.0;
        if (state1 === this.STATES.EMPTY || state2 === this.STATES.EMPTY) return 0.8;
        if (state1 === this.STATES.FULL || state2 === this.STATES.FULL) return 0.7;

        // Diagonal state compatibility - geometric reasoning
        const diagonalCompatibility = {
            [this.STATES.HALF_DIAG_TL_BR]: {
                [this.STATES.HALF_DIAG_TL_BR]: 1.0,    // Same
                [this.STATES.HALF_DIAG_BR_TL]: 0.9,    // Complementary
                [this.STATES.HALF_DIAG_TR_BL]: 0.1,    // Conflicting
                [this.STATES.HALF_DIAG_BL_TR]: 0.1     // Conflicting
            },
            [this.STATES.HALF_DIAG_TR_BL]: {
                [this.STATES.HALF_DIAG_TR_BL]: 1.0,    // Same
                [this.STATES.HALF_DIAG_BL_TR]: 0.9,    // Complementary
                [this.STATES.HALF_DIAG_TL_BR]: 0.1,    // Conflicting
                [this.STATES.HALF_DIAG_BR_TL]: 0.1     // Conflicting
            },
            [this.STATES.HALF_DIAG_BL_TR]: {
                [this.STATES.HALF_DIAG_BL_TR]: 1.0,    // Same
                [this.STATES.HALF_DIAG_TR_BL]: 0.9,    // Complementary
                [this.STATES.HALF_DIAG_TL_BR]: 0.1,    // Conflicting
                [this.STATES.HALF_DIAG_BR_TL]: 0.1     // Conflicting
            },
            [this.STATES.HALF_DIAG_BR_TL]: {
                [this.STATES.HALF_DIAG_BR_TL]: 1.0,    // Same
                [this.STATES.HALF_DIAG_TL_BR]: 0.9,    // Complementary
                [this.STATES.HALF_DIAG_TR_BL]: 0.1,    // Conflicting
                [this.STATES.HALF_DIAG_BL_TR]: 0.1     // Conflicting
            }
        };

        return diagonalCompatibility[state1]?.[state2] || 0.1;
    }

    // Directional flow vectors for diagonal states
    getStateDirection(state) {
        switch(state) {
            case this.STATES.HALF_DIAG_TL_BR: return {dx: 1, dy: 1};  // SE flow
            case this.STATES.HALF_DIAG_TR_BL: return {dx: -1, dy: 1};  // SW flow
            case this.STATES.HALF_DIAG_BL_TR: return {dx: 1, dy: -1};  // NE flow
            case this.STATES.HALF_DIAG_BR_TL: return {dx: -1, dy: -1}; // NW flow
            default: return {dx: 0, dy: 0};  // Empty or Full have no direction
        }
    }

    // Calculate total energy with 6-state awareness and kernel-based zebra detection
    calculateEnergy(grid, totalArea, targetArea, states) {
        let totalEnergy = 0;

        // 1. Geometric continuity energy
        totalEnergy += this.calculateGeometricContinuityEnergy(grid, states);

        // 2. Directional flow energy
        totalEnergy += this.calculateDirectionalFlowEnergy(grid, states);

        // 3. Sharp corners energy
        totalEnergy += this.calculateSharpCornersEnergy(grid, states);

        // 4. Incompatible connections energy
        totalEnergy += this.calculateIncompatibleConnectionsEnergy(grid, states);

        // 5. Kernel-based zebra pattern energy
        totalEnergy += this.zebraKernels.calculateZebraEnergy(grid, states, this.energyWeights.zebraPatterns);

        // 6. Area constraint energy
        const areaDiff = Math.abs(totalArea - targetArea);
        totalEnergy += areaDiff * this.energyWeights.areaConstraint;

        // Normalize by grid size
        totalEnergy = totalEnergy / (this.gridSize * this.gridSize);

        return totalEnergy;
    }

    // Geometric continuity - favors smooth connections between compatible states
    calculateGeometricContinuityEnergy(grid, states) {
        let continuityEnergy = 0;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const currentState = grid[row][col];
                if (currentState === states.EMPTY) continue;

                const neighbors = this.getNeighborStates(grid, row, col);
                let compatibilitySum = 0;
                let neighborCount = 0;

                for (const neighbor of neighbors) {
                    if (neighbor.state !== states.EMPTY) {
                        const compatibility = this.getStateCompatibility(currentState, neighbor.state);
                        compatibilitySum += compatibility;
                        neighborCount++;
                    }
                }

                if (neighborCount > 0) {
                    const avgCompatibility = compatibilitySum / neighborCount;
                    continuityEnergy += (1.0 - avgCompatibility) * this.energyWeights.geometricContinuity;
                }
            }
        }

        return continuityEnergy;
    }

    // Directional flow - favors consistent directional patterns
    calculateDirectionalFlowEnergy(grid, states) {
        let flowEnergy = 0;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const currentState = grid[row][col];
                if (!this.isDiagonalState(currentState)) continue;

                const currentDirection = this.getStateDirection(currentState);
                const neighbors = this.getNeighborStates(grid, row, col);

                let flowConsistency = 0;
                let diagonalNeighborCount = 0;

                for (const neighbor of neighbors) {
                    if (this.isDiagonalState(neighbor.state)) {
                        const neighborDirection = this.getStateDirection(neighbor.state);
                        const directionSimilarity = this.calculateDirectionSimilarity(
                            currentDirection, neighborDirection
                        );
                        flowConsistency += directionSimilarity;
                        diagonalNeighborCount++;
                    }
                }

                if (diagonalNeighborCount > 0) {
                    const avgFlowConsistency = flowConsistency / diagonalNeighborCount;
                    flowEnergy += (1.0 - avgFlowConsistency) * this.energyWeights.directionalFlow;
                }
            }
        }

        return flowEnergy;
    }

    // Sharp corners - detects geometric corners from state transitions
    calculateSharpCornersEnergy(grid, states) {
        let cornerEnergy = 0;

        for (let row = 1; row < this.gridSize - 1; row++) {
            for (let col = 1; col < this.gridSize - 1; col++) {
                const currentState = grid[row][col];
                if (currentState === states.EMPTY) continue;

                // Check for corner patterns in 3x3 neighborhood
                const cornerPatterns = this.detectCornerPatterns(grid, row, col, states);
                for (const pattern of cornerPatterns) {
                    cornerEnergy += pattern.sharpness * this.energyWeights.sharpCorners;
                }
            }
        }

        return cornerEnergy;
    }

    // Incompatible connections - penalizes geometrically incompatible state adjacencies
    calculateIncompatibleConnectionsEnergy(grid, states) {
        let incompatibilityEnergy = 0;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const currentState = grid[row][col];
                if (currentState === states.EMPTY) continue;

                const neighbors = this.getNeighborStates(grid, row, col);
                for (const neighbor of neighbors) {
                    const compatibility = this.getStateCompatibility(currentState, neighbor.state);
                    if (compatibility < 0.3) { // Strong incompatibility threshold
                        incompatibilityEnergy += (0.3 - compatibility) * this.energyWeights.incompatibleConnections;
                    }
                }
            }
        }

        return incompatibilityEnergy * 0.5; // Half-weight to avoid over-penalization
    }

    // Detect corner patterns in 3x3 neighborhood
    detectCornerPatterns(grid, centerRow, centerCol, states) {
        const patterns = [];
        const centerState = grid[centerRow][centerCol];

        // Get 3x3 neighborhood
        const neighborhood = [];
        for (let dr = -1; dr <= 1; dr++) {
            const row = [];
            for (let dc = -1; dc <= 1; dc++) {
                const r = centerRow + dr;
                const c = centerCol + dc;
                if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) {
                    row.push(grid[r][c]);
                } else {
                    row.push(states.EMPTY);
                }
            }
            neighborhood.push(row);
        }

        // Analyze corner patterns
        // Pattern 1: L-shaped transitions
        const lPatterns = [
            [[-1, -1], [-1, 0], [0, -1]], // Top-left L
            [[-1, 0], [-1, 1], [0, 1]],   // Top-right L
            [[0, -1], [1, -1], [1, 0]],   // Bottom-left L
            [[0, 1], [1, 0], [1, 1]]      // Bottom-right L
        ];

        for (const pattern of lPatterns) {
            const cornerSharpness = this.analyzeLShape(neighborhood, pattern, centerState, states);
            if (cornerSharpness > 0.5) {
                patterns.push({type: 'L-shape', sharpness: cornerSharpness});
            }
        }

        // Pattern 2: Diagonal transition corners
        if (this.isDiagonalState(centerState)) {
            const diagonalCornerSharpness = this.analyzeDiagonalCorner(neighborhood, centerState, states);
            if (diagonalCornerSharpness > 0.3) {
                patterns.push({type: 'diagonal-corner', sharpness: diagonalCornerSharpness});
            }
        }

        return patterns;
    }

    // Analyze L-shaped corner patterns
    analyzeLShape(neighborhood, pattern, centerState, states) {
        const [p1, p2, p3] = pattern;
        const s1 = neighborhood[1 + p1[0]][1 + p1[1]];
        const s2 = neighborhood[1 + p2[0]][1 + p2[1]];
        const s3 = neighborhood[1 + p3[0]][1 + p3[1]];

        // Check if this forms a sharp corner
        const centerOccupied = centerState !== states.EMPTY;
        const armsOccupied = (s1 !== states.EMPTY) + (s2 !== states.EMPTY) + (s3 !== states.EMPTY);

        if (centerOccupied && armsOccupied === 2) {
            // Check compatibility of the arms with center
            const compat1 = this.getStateCompatibility(centerState, s1);
            const compat2 = this.getStateCompatibility(centerState, s2);
            const compat3 = this.getStateCompatibility(centerState, s3);

            const minCompatibility = Math.min(
                s1 !== states.EMPTY ? compat1 : 1.0,
                s2 !== states.EMPTY ? compat2 : 1.0,
                s3 !== states.EMPTY ? compat3 : 1.0
            );

            return (1.0 - minCompatibility) * 1.5; // Sharpness penalty
        }

        return 0;
    }

    // Analyze diagonal corner patterns
    analyzeDiagonalCorner(neighborhood, centerState, states) {
        let cornerSharpness = 0;

        // Check interactions with different diagonal states
        const diagonalPositions = [
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];

        for (const [dr, dc] of diagonalPositions) {
            const neighborState = neighborhood[1 + dr][1 + dc];
            if (this.isDiagonalState(neighborState)) {
                const compatibility = this.getStateCompatibility(centerState, neighborState);
                if (compatibility < 0.5) {
                    cornerSharpness += (0.5 - compatibility);
                }
            }
        }

        return Math.min(cornerSharpness, 1.0);
    }

    // Calculate direction similarity between two directional vectors
    calculateDirectionSimilarity(dir1, dir2) {
        if (dir1.dx === 0 && dir1.dy === 0) return 0.5;
        if (dir2.dx === 0 && dir2.dy === 0) return 0.5;

        // Dot product normalized
        const dotProduct = dir1.dx * dir2.dx + dir1.dy * dir2.dy;
        const mag1 = Math.sqrt(dir1.dx * dir1.dx + dir1.dy * dir1.dy);
        const mag2 = Math.sqrt(dir2.dx * dir2.dx + dir2.dy * dir2.dy);

        return (dotProduct / (mag1 * mag2) + 1) / 2; // Normalize to [0, 1]
    }

    // Helper methods
    isDiagonalState(state) {
        return state >= 2 && state <= 5;
    }

    getNeighborStates(grid, row, col) {
        const neighbors = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
                neighbors.push({
                    row: newRow,
                    col: newCol,
                    state: grid[newRow][newCol]
                });
            }
        }

        return neighbors;
    }

    // Calculate energy difference for local change (efficient)
    calculateEnergyDifference(grid, row, col, newState, totalArea, targetArea, states) {
        const oldState = grid[row][col];
        if (oldState === newState) return 0;

        // For efficiency with zebra kernels, we need a larger affected region
        const affectedRadius = 3; // Larger radius for zebra pattern detection
        const startRow = Math.max(0, row - affectedRadius);
        const endRow = Math.min(this.gridSize - 1, row + affectedRadius);
        const startCol = Math.max(0, col - affectedRadius);
        const endCol = Math.min(this.gridSize - 1, row + affectedRadius);

        // Create temporary grid with the change
        const tempGrid = grid.map(r => [...r]);
        tempGrid[row][col] = newState;

        // Calculate old and new energy for affected region
        let oldRegionEnergy = 0;
        let newRegionEnergy = 0;

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                // Old energy contribution
                oldRegionEnergy += this.calculateCellEnergy(grid, r, c, states);
                // New energy contribution
                newRegionEnergy += this.calculateCellEnergy(tempGrid, r, c, states);
            }
        }

        // Area constraint energy difference
        const oldContribution = this.getAreaContribution(oldState, states);
        const newContribution = this.getAreaContribution(newState, states);
        const newTotalArea = totalArea + newContribution - oldContribution;

        const oldAreaPenalty = Math.abs(totalArea - targetArea) * this.energyWeights.areaConstraint;
        const newAreaPenalty = Math.abs(newTotalArea - targetArea) * this.energyWeights.areaConstraint;

        // Calculate zebra pattern energy difference (requires full grid for kernel convolution)
        const oldZebraEnergy = this.zebraKernels.calculateZebraEnergy(grid, states, this.energyWeights.zebraPatterns);
        const newZebraEnergy = this.zebraKernels.calculateZebraEnergy(tempGrid, states, this.energyWeights.zebraPatterns);
        const zebraDelta = newZebraEnergy - oldZebraEnergy;

        const deltaEnergy = (newRegionEnergy - oldRegionEnergy) / (this.gridSize * this.gridSize) +
                           zebraDelta +
                           (newAreaPenalty - oldAreaPenalty) / (this.gridSize * this.gridSize);

        return deltaEnergy;
    }

    // Calculate energy contribution of a single cell
    calculateCellEnergy(grid, row, col, states) {
        const currentState = grid[row][col];
        let cellEnergy = 0;

        if (currentState === states.EMPTY) return 0;

        const neighbors = this.getNeighborStates(grid, row, col);

        // Geometric continuity
        let compatibilitySum = 0;
        let neighborCount = 0;
        for (const neighbor of neighbors) {
            if (neighbor.state !== states.EMPTY) {
                const compatibility = this.getStateCompatibility(currentState, neighbor.state);
                compatibilitySum += compatibility;
                neighborCount++;

                // Incompatible connections penalty
                if (compatibility < 0.3) {
                    cellEnergy += (0.3 - compatibility) * this.energyWeights.incompatibleConnections * 0.5;
                }
            }
        }

        if (neighborCount > 0) {
            const avgCompatibility = compatibilitySum / neighborCount;
            cellEnergy += (1.0 - avgCompatibility) * this.energyWeights.geometricContinuity;
        }

        // Directional flow for diagonal states
        if (this.isDiagonalState(currentState)) {
            const currentDirection = this.getStateDirection(currentState);
            let flowConsistency = 0;
            let diagonalNeighborCount = 0;

            for (const neighbor of neighbors) {
                if (this.isDiagonalState(neighbor.state)) {
                    const neighborDirection = this.getStateDirection(neighbor.state);
                    const directionSimilarity = this.calculateDirectionSimilarity(
                        currentDirection, neighborDirection
                    );
                    flowConsistency += directionSimilarity;
                    diagonalNeighborCount++;
                }
            }

            if (diagonalNeighborCount > 0) {
                const avgFlowConsistency = flowConsistency / diagonalNeighborCount;
                cellEnergy += (1.0 - avgFlowConsistency) * this.energyWeights.directionalFlow;
            }
        }

        return cellEnergy;
    }

    // Helper method for area contribution
    getAreaContribution(state, states) {
        switch(state) {
            case states.EMPTY: return 0;
            case states.FULL: return 1;
            default: return 0.5; // All half states
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
            console.log('[EnhancedEnergySystem]', ...args);
        }
    }
}