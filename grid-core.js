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

        // Precomputed state inventories for efficient sampling
        this.stateInventories = null;
        this.inventoryValid = false;

        // Initialize grid
        this.initializeGrid();
    }

    initializeGrid() {
        this.grid = Array(this.gridSize).fill(null).map(() =>
            Array(this.gridSize).fill(this.STATES.EMPTY)
        );
        this.totalArea = 0;
        this.targetArea = Math.floor(this.gridSize * this.gridSize * 0.3); // 30% target

        // Invalidate state inventories - will be computed on demand
        this.inventoryValid = false;

        // Create initial pattern for immediate visualization
        this.createInitialPattern();

        return {
            grid: this.grid,
            totalArea: this.totalArea,
            targetArea: this.targetArea
        };
    }

    // Compute state inventories (O(n²) operation, cached until invalidated)
    computeStateInventories() {
        if (this.inventoryValid && this.stateInventories) {
            return this.stateInventories;
        }

        // Initialize inventories for all possible states (0-5)
        this.stateInventories = {};
        for (let state = 0; state <= 5; state++) {
            this.stateInventories[state] = {
                count: 0
            };
        }

        // Scan grid once to count all states
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const state = this.grid[row][col];
                this.stateInventories[state].count++;
            }
        }

        this.inventoryValid = true;
        return this.stateInventories;
    }

    // Incrementally update state inventories when a single cell changes (O(1) operation)
    updateStateInventories(oldState, newState) {
        if (!this.inventoryValid || !this.stateInventories) {
            // If inventories not valid, recompute from scratch
            this.computeStateInventories();
            return;
        }

        // Decrement count for old state
        if (this.stateInventories[oldState]) {
            this.stateInventories[oldState].count--;
        }

        // Increment count for new state
        if (this.stateInventories[newState]) {
            this.stateInventories[newState].count++;
        }
    }

    // Invalidate state inventories when grid changes in bulk
    invalidateStateInventories() {
        this.inventoryValid = false;
        this.stateInventories = null;
    }

    createInitialPattern() {
        // Create a central blob pattern as starting point
        const centerRow = Math.floor(this.gridSize / 2);
        const centerCol = Math.floor(this.gridSize / 2);
        const blobRadius = Math.max(2, Math.floor(this.gridSize / 8));

        // Invalidate inventories since we're doing bulk changes
        this.invalidateStateInventories();

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
                            // CURRENT CODE (comment out):
                            // // Random diagonal state for edge variation
                            // const diagonalStates = [
                            //     this.STATES.HALF_DIAG_TL_BR,
                            //     this.STATES.HALF_DIAG_TR_BL,
                            //     this.STATES.HALF_DIAG_BL_TR,
                            //     this.STATES.HALF_DIAG_BR_TL
                            // ];
                            // const randomState = diagonalStates[Math.floor(Math.random() * diagonalStates.length)];
                            // this.grid[row][col] = randomState;
                            // this.totalArea += 0.5;

                            // DESIRED CODE:
                            // Use only FULL states for edges instead of diagonal states
                            this.grid[row][col] = this.STATES.FULL;
                            this.totalArea += 1;
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
                // CURRENT CODE (comment out):
                // const state = Math.random() < 0.7 ? this.STATES.FULL :
                //               (Math.floor(Math.random() * 4) + 2); // 70% full, 30% diagonal

                // DESIRED CODE:
                // Use only FULL states instead of allowing diagonal states
                const state = this.STATES.FULL; // 100% full states

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

        // CURRENT CODE (comment out):
        // const nextState = (currentState + 1) % 6;  // Cycles through all 6 states

        // DESIRED CODE:
        // Toggle only between EMPTY (0) and FULL (1) states
        const nextState = currentState === this.STATES.EMPTY ? this.STATES.FULL : this.STATES.EMPTY;

        // Update area count
        const oldContribution = this.getAreaContribution(currentState);
        const newContribution = this.getAreaContribution(nextState);
        this.totalArea += newContribution - oldContribution;

        // Update grid
        this.grid[row][col] = nextState;

        // Update state inventories incrementally
        this.updateStateInventories(currentState, nextState);

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

        // Update grid
        this.grid[row][col] = newState;
        this.totalArea += newContribution - oldContribution;

        // Update state inventories incrementally
        this.updateStateInventories(oldState, newState);

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

        // Invalidate inventories since we're doing bulk changes
        this.invalidateStateInventories();

        // Create random initial configuration
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (Math.random() < 0.3) { // 30% chance of being occupied
                    // CURRENT CODE (comment out):
                    // const state = Math.floor(Math.random() * 6); // Can be 0-5

                    // DESIRED CODE:
                    // Restrict to only EMPTY (0) and FULL (1) states
                    const state = this.STATES.FULL; // Always use FULL when occupied

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