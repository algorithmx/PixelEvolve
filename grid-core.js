// Grid Core - State management and basic grid operations

export class GridCore {
    constructor(gridSize, config = {}) {
        this.gridSize = gridSize;
        this.config = config;

        // Grid state constants
        this.STATES = {
            EMPTY: 0,
            FULL: 1,
            HALF_DIAG_TL_BR: 2,  // Top-left to bottom-right
            HALF_DIAG_TR_BL: 3,  // Top-right to bottom-left
            HALF_DIAG_BL_TR: 4,  // Bottom-left to top-right
            HALF_DIAG_BR_TL: 5   // Bottom-right to top-left
        };

        // Initialize grid
        this.initializeGrid();
    }

    initializeGrid() {
        this.grid = Array(this.gridSize).fill(null).map(() =>
            Array(this.gridSize).fill(this.STATES.EMPTY)
        );
        this.totalArea = 0;
        this.targetArea = Math.floor(this.gridSize * this.gridSize * 0.3); // 30% target

        // Create initial pattern for immediate visualization
        this.createInitialPattern();

        return {
            grid: this.grid,
            totalArea: this.totalArea,
            targetArea: this.targetArea
        };
    }

    createInitialPattern() {
        // Create a central blob pattern as starting point
        const centerRow = Math.floor(this.gridSize / 2);
        const centerCol = Math.floor(this.gridSize / 2);
        const blobRadius = Math.max(2, Math.floor(this.gridSize / 8));

        for (let row = centerRow - blobRadius; row <= centerRow + blobRadius; row++) {
            for (let col = centerCol - blobRadius; col <= centerCol + blobRadius; col++) {
                if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
                    const distance = Math.sqrt((row - centerRow) ** 2 + (col - centerCol) ** 2);
                    if (distance <= blobRadius) {
                        // Use FULL states for core, diagonal states for edges
                        if (distance < blobRadius * 0.6) {
                            this.grid[row][col] = this.STATES.FULL;
                            this.totalArea += 1;
                        } else {
                            // Random diagonal state for edge variation
                            const diagonalStates = [
                                this.STATES.HALF_DIAG_TL_BR,
                                this.STATES.HALF_DIAG_TR_BL,
                                this.STATES.HALF_DIAG_BL_TR,
                                this.STATES.HALF_DIAG_BR_TL
                            ];
                            const randomState = diagonalStates[Math.floor(Math.random() * diagonalStates.length)];
                            this.grid[row][col] = randomState;
                            this.totalArea += 0.5;
                        }
                    }
                }
            }
        }

        // Add some random scattered cells to reach target area
        while (this.totalArea < this.targetArea * 0.7) { // Start with 70% of target
            const row = Math.floor(Math.random() * this.gridSize);
            const col = Math.floor(Math.random() * this.gridSize);

            if (this.grid[row][col] === this.STATES.EMPTY) {
                const state = Math.random() < 0.7 ? this.STATES.FULL :
                              (Math.floor(Math.random() * 4) + 2); // 70% full, 30% diagonal
                this.grid[row][col] = state;
                this.totalArea += this.getAreaContribution(state);
            }
        }
    }

    getAreaContribution(state) {
        switch(state) {
            case this.STATES.EMPTY: return 0;
            case this.STATES.FULL: return 1;
            default: return 0.5; // All half states
        }
    }

    getNeighbors(row, col) {
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
                neighbors.push({row: newRow, col: newCol});
            }
        }

        return neighbors;
    }

    getStateSafe(row, col) {
        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
            return this.grid[row][col];
        }
        return this.STATES.EMPTY;
    }

    toggleCell(row, col) {
        const currentState = this.grid[row][col];
        const nextState = (currentState + 1) % 6;

        // Update area count
        const oldContribution = this.getAreaContribution(currentState);
        const newContribution = this.getAreaContribution(nextState);
        this.totalArea += newContribution - oldContribution;

        this.grid[row][col] = nextState;

        return {
            oldState: currentState,
            newState: nextState,
            areaChange: newContribution - oldContribution
        };
    }

    setCell(row, col, newState) {
        if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) {
            throw new Error(`Cell coordinates out of bounds: (${row}, ${col})`);
        }

        const oldState = this.grid[row][col];
        if (oldState === newState) return null; // No change

        const oldContribution = this.getAreaContribution(oldState);
        const newContribution = this.getAreaContribution(newState);

        this.grid[row][col] = newState;
        this.totalArea += newContribution - oldContribution;

        return {
            oldState: oldState,
            newState: newState,
            areaChange: newContribution - oldContribution
        };
    }

    randomize() {
        // Reset grid
        this.grid = Array(this.gridSize).fill(null).map(() =>
            Array(this.gridSize).fill(this.STATES.EMPTY)
        );
        this.totalArea = 0;

        // Create random initial configuration
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (Math.random() < 0.3) { // 30% chance of being occupied
                    const state = Math.floor(Math.random() * 6);
                    this.grid[row][col] = state;
                    this.totalArea += this.getAreaContribution(state);
                }
            }
        }

        return {
            grid: this.grid,
            totalArea: this.totalArea,
            targetArea: this.targetArea
        };
    }

    reset() {
        return this.initializeGrid();
    }

    resize(newSize) {
        this.gridSize = newSize;
        return this.initializeGrid();
    }

    // Convert grid to numeric representation for convolution
    gridToNumeric() {
        return this.grid.map(row =>
            row.map(state => {
                // Convert states to numeric values (0 = empty, 1 = occupied)
                return state === this.STATES.EMPTY ? 0 : 1;
            })
        );
    }

    // Get grid statistics
    getGridStats() {
        const stateCounts = {};
        let occupiedCount = 0;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const state = this.grid[row][col];
                stateCounts[state] = (stateCounts[state] || 0) + 1;
                if (state !== this.STATES.EMPTY) occupiedCount++;
            }
        }

        return {
            gridSize: this.gridSize,
            totalCells: this.gridSize * this.gridSize,
            occupiedCells: occupiedCount,
            totalArea: this.totalArea,
            targetArea: this.targetArea,
            areaRatio: this.totalArea / this.targetArea,
            stateDistribution: stateCounts
        };
    }
}