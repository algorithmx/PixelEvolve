// Evolution Engine - Evolution algorithms (annealing and greedy)

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

        // Evolution method
        this.useSimulatedAnnealing = config.useSimulatedAnnealing !== false;

        // Simulated annealing parameters
        this.temperature = 1.0;
        this.initialTemperature = 1.0;
        this.coolingRate = config.coolingRate || 0.995;
        this.minTemperature = config.minTemperature || 0.001;

        // Cost function weights (for greedy optimization)
        this.costWeights = {
            edgeSharpness: config.edgeSharpness || 1.0,
            cornerPenalty: config.cornerPenalty || 0.5,
            patternPenalty: config.patternPenalty || 2.0
        };

        // Evolution state
        this.currentEnergy = 0;
        this.currentCost = 0;
        this.costHistory = [];

        this.log('Evolution engine initialized');
    }

    // Initialize simulated annealing
    initializeSimulatedAnnealing(energySystem, grid, totalArea, targetArea, states) {
        if (!energySystem) {
            throw new Error('EnergySystem required for simulated annealing');
        }

        // Set initial temperature based on current energy
        this.currentEnergy = energySystem.calculateEnergy(grid, totalArea, targetArea, states);
        this.initialTemperature = Math.max(0.1, this.currentEnergy * 0.5);
        this.temperature = this.initialTemperature;

        this.log('Simulated annealing initialized with temperature:', this.temperature);
    }

    // Single step of simulated annealing evolution
    annealingStep(gridCore, energySystem, states) {
        if (!energySystem) {
            throw new Error('EnergySystem required for annealing step');
        }

        // Select random cell and random new state
        const row = Math.floor(Math.random() * this.gridSize);
        const col = Math.floor(Math.random() * this.gridSize);
        const currentState = gridCore.grid[row][col];
        const possibleStates = [0, 1, 2, 3, 4, 5].filter(s => s !== currentState);
        const newState = possibleStates[Math.floor(Math.random() * possibleStates.length)];

        // Calculate energy difference
        const deltaEnergy = energySystem.calculateEnergyDifference(
            gridCore.grid, row, col, newState,
            gridCore.totalArea, gridCore.targetArea, states
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

        // Apply change if accepted
        if (acceptChange && this.applyChangeWithAreaConstraint(gridCore, row, col, newState)) {
            this.currentEnergy += deltaEnergy;
            this.log(`Annealing: accepted change at (${row},${col}), ΔE=${deltaEnergy.toFixed(3)}, T=${this.temperature.toFixed(4)}`);
            return { accepted: true, row, col, oldState: currentState, newState, deltaEnergy };
        }

        return { accepted: false };
    }

    // Apply change with area constraint checking
    applyChangeWithAreaConstraint(gridCore, row, col, newState) {
        const oldState = gridCore.grid[row][col];
        const oldContribution = gridCore.getAreaContribution(oldState);
        const newContribution = gridCore.getAreaContribution(newState);
        const newTotalArea = gridCore.totalArea + newContribution - oldContribution;

        // More flexible area constraint during annealing
        const temperatureFactor = Math.max(0.1, this.temperature / this.initialTemperature);
        const areaTolerance = gridCore.targetArea * 0.3 * temperatureFactor; // Up to 30% tolerance at high temp

        // Always allow changes that move toward target area
        const currentDiff = Math.abs(gridCore.totalArea - gridCore.targetArea);
        const newDiff = Math.abs(newTotalArea - gridCore.targetArea);

        if (newDiff < currentDiff) {
            // Change moves us closer to target - accept
        } else if (newDiff > areaTolerance) {
            // Too far from target area
            if (this.temperature < 0.01 && newDiff > gridCore.targetArea * 0.15) {
                return false; // Strict enforcement at low temperature
            } else if (newDiff > gridCore.targetArea * 0.5) {
                return false; // Never allow more than 50% deviation
            }
        }

        // Apply the change
        gridCore.setCell(row, col, newState);

        return true;
    }

    // Greedy optimization step
    greedyStep(gridCore, states) {
        const candidates = this.findEvolutionCandidates(gridCore, states);
        this.log('Found', candidates.length, 'candidates');

        if (candidates.length > 0) {
            // Apply the best change
            const bestChange = candidates[0];
            this.log('Applying best change:', bestChange);
            const applied = this.applyGreedyChange(gridCore, bestChange.row, bestChange.col, bestChange.newState);
            return {
                applied,
                change: bestChange,
                costChange: bestChange.costChange
            };
        }

        return { applied: false, change: null, costChange: 0 };
    }

    // Find evolution candidates for greedy optimization
    findEvolutionCandidates(gridCore, states) {
        const candidates = [];

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const currentState = gridCore.grid[row][col];

                // Try all possible state changes
                for (let newState = 0; newState < 6; newState++) {
                    if (newState === currentState) continue;

                    const costChange = this.calculateCostChange(gridCore, row, col, newState, states);
                    candidates.push({
                        row, col, newState, costChange
                    });
                }
            }
        }

        // Sort by cost improvement (most negative first)
        return candidates.filter(c => c.costChange < -0.1).sort((a, b) => a.costChange - b.costChange);
    }

    // Calculate cost change for greedy optimization
    calculateCostChange(gridCore, row, col, newState, states) {
        const oldState = gridCore.grid[row][col];

        // Temporarily apply the change
        gridCore.grid[row][col] = newState;
        const oldTotalArea = gridCore.totalArea;
        gridCore.totalArea += gridCore.getAreaContribution(newState) - gridCore.getAreaContribution(oldState);

        const newCost = this.calculateCost(gridCore, states);

        // Revert the change
        gridCore.grid[row][col] = oldState;
        gridCore.totalArea = oldTotalArea;

        return newCost - this.currentCost;
    }

    // Apply greedy change
    applyGreedyChange(gridCore, row, col, newState) {
        const oldState = gridCore.grid[row][col];

        // Update area count if area preservation is enabled
        if (this.areaPreservation) {
            const oldContribution = gridCore.getAreaContribution(oldState);
            const newContribution = gridCore.getAreaContribution(newState);
            const newTotalArea = gridCore.totalArea + newContribution - oldContribution;

            // Allow changes that move toward target area, but prevent overshooting by too much
            if (gridCore.totalArea < gridCore.targetArea * 0.8) {
                // Building phase: allow adding cells up to 80% of target
                if (newTotalArea <= gridCore.targetArea * 0.8) {
                    // Allow growth toward target
                } else if (newContribution <= oldContribution) {
                    // Allow removals even when above 80%
                } else {
                    return false; // Reject excessive growth
                }
            } else {
                // Preservation phase: stay close to target area (±2 units tolerance)
                if (Math.abs(newTotalArea - gridCore.targetArea) > 2) {
                    return false; // Reject change that deviates too much from target
                }
            }
        }

        gridCore.setCell(row, col, newState);
        return true;
    }

    // Calculate cost for greedy optimization
    calculateCost(gridCore, states) {
        let totalCost = 0;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                totalCost += this.getCellCost(gridCore, row, col, states);
            }
        }

        // Area preservation penalty
        if (this.areaPreservation) {
            const areaDiff = Math.abs(gridCore.totalArea - gridCore.targetArea);
            totalCost += areaDiff * 10;
        }

        return totalCost;
    }

    // Get cost for individual cell
    getCellCost(gridCore, row, col, states) {
        let cellCost = 0;
        const state = gridCore.grid[row][col];

        // Edge sharpness penalty (favors smooth edges)
        const neighbors = gridCore.getNeighbors(row, col);
        const differentNeighbors = neighbors.filter(n => gridCore.grid[n.row][n.col] !== state).length;
        cellCost += differentNeighbors * this.costWeights.edgeSharpness;

        // Corner penalty (sharp corners are penalized)
        if (this.isSharpCorner(gridCore, row, col, states)) {
            cellCost += this.costWeights.cornerPenalty * 5;
        }

        // Pattern penalty (checkerboard and zebra patterns)
        if (this.hasPattern(gridCore, row, col, states)) {
            cellCost += this.costWeights.patternPenalty * 3;
        }

        return cellCost;
    }

    // Check if cell forms sharp corner
    isSharpCorner(gridCore, row, col, states) {
        const state = gridCore.grid[row][col];
        if (state === states.EMPTY) return false;

        // Check for sharp corner patterns
        const patterns = [
            // Top-left corner
            [[-1, -1], [-1, 0], [0, -1]],
            // Top-right corner
            [[-1, 0], [-1, 1], [0, 1]],
            // Bottom-left corner
            [[0, -1], [1, -1], [1, 0]],
            // Bottom-right corner
            [[0, 1], [1, 0], [1, 1]]
        ];

        for (const pattern of patterns) {
            const [p1, p2, p3] = pattern;
            const s1 = gridCore.getStateSafe(row + p1[0], col + p1[1]);
            const s2 = gridCore.getStateSafe(row + p2[0], col + p2[1]);
            const s3 = gridCore.getStateSafe(row + p3[0], col + p3[1]);

            if (s1 === states.EMPTY && s2 === states.EMPTY && s3 === states.EMPTY) {
                return true;
            }
        }

        return false;
    }

    // Check if cell has undesirable patterns
    hasPattern(gridCore, row, col, states) {
        const checkerboard = this.checkCheckerboard(gridCore, row, col, states);
        const zebra = this.checkZebraPattern(gridCore, row, col, states);
        return checkerboard || zebra;
    }

    // Check for checkerboard pattern
    checkCheckerboard(gridCore, row, col, states) {
        const neighbors = gridCore.getNeighbors(row, col);
        const currentState = gridCore.grid[row][col];

        let alternating = 0;
        for (const neighbor of neighbors) {
            if (gridCore.grid[neighbor.row][neighbor.col] !== currentState) {
                alternating++;
            }
        }

        return alternating >= 6; // High alternation suggests checkerboard
    }

    // Check for zebra pattern
    checkZebraPattern(gridCore, row, col, states) {
        const currentState = gridCore.grid[row][col];

        // Check row alternation
        let rowAlternating = true;
        for (let c = 0; c < this.gridSize; c++) {
            if (c !== col && gridCore.grid[row][c] === currentState) {
                if ((c - col) % 2 !== 0) {
                    rowAlternating = false;
                    break;
                }
            }
        }

        // Check column alternation
        let colAlternating = true;
        for (let r = 0; r < this.gridSize; r++) {
            if (r !== row && gridCore.grid[r][col] === currentState) {
                if ((r - row) % 2 !== 0) {
                    colAlternating = false;
                    break;
                }
            }
        }

        return rowAlternating || colAlternating;
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
            this.log('Annealing terminated: minimum temperature reached');
            return true;
        }

        // Energy converged
        if (this.costHistory.length > 50) {
            const recentEnergies = this.costHistory.slice(-20);
            const maxEnergy = Math.max(...recentEnergies);
            const minEnergy = Math.min(...recentEnergies);
            const energyRange = maxEnergy - minEnergy;

            if (energyRange < 0.001) {
                this.log('Annealing terminated: energy converged');
                return true;
            }
        }

        // Maximum steps
        if (this.currentStep >= this.maxSteps) {
            this.log('Annealing terminated: maximum steps reached');
            return true;
        }

        return false;
    }

    // Check if greedy optimization should terminate
    shouldTerminateGreedy() {
        // Maximum steps reached
        if (this.currentStep >= this.maxSteps) return true;

        // Cost convergence (no significant improvement)
        if (this.costHistory.length > 10) {
            const recentCosts = this.costHistory.slice(-10);
            const maxChange = Math.max(...recentCosts) - Math.min(...recentCosts);
            if (maxChange < 0.1) return true;
        }

        // Cost below threshold
        if (this.currentCost < 0.1 * this.gridSize * this.gridSize) return true;

        return false;
    }

    // Start evolution
    startEvolution() {
        this.log('startEvolution() called');
        this.isRunning = true;
    }

    // Stop evolution
    stopEvolution() {
        this.log('stopEvolution() called');
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

    // Set evolution parameters
    setEvolutionMethod(useAnnealing) {
        this.useSimulatedAnnealing = useAnnealing;
        this.log(`Evolution method set to: ${useAnnealing ? 'Simulated Annealing' : 'Greedy Optimization'}`);
    }

    setEvolutionSpeed(speed) {
        this.evolutionSpeed = speed;
    }

    setMaxSteps(maxSteps) {
        this.maxSteps = maxSteps;
    }

    setCostWeight(type, value) {
        this.costWeights[type] = value;
    }

    setAnnealingParameter(param, value) {
        switch(param) {
            case 'temperature':
                this.temperature = value;
                this.initialTemperature = value;
                break;
            case 'coolingRate':
                this.coolingRate = value;
                break;
            case 'minTemperature':
                this.minTemperature = value;
                break;
        }
        this.log(`Annealing parameter ${param} set to ${value}`);
    }

    resetTemperature() {
        this.temperature = this.initialTemperature;
        this.log('Temperature reset to initial value:', this.temperature);
    }

    getCurrentTemperature() {
        return this.temperature || 0;
    }

    log(...args) {
        if (this.debugMode) {
            console.log('[EvolutionEngine]', ...args);
        }
    }
}