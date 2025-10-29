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

    // Non-uniform grid support: normalized grid line positions in [0,1]
    // Arrays length = gridSize + 1, monotonic with 0 at start and 1 at end
    this.xPoints = null; // horizontal axis grid lines (columns boundaries)
    this.yPoints = null; // vertical axis grid lines (row boundaries)

        // Boundary markers: two groups of edge markers that never overlap
        // Structure: { group1: {top:[], right:[], bottom:[], left:[]}, group2: {...} }
        // Each marker: { side: 'top'|'right'|'bottom'|'left', start: Number, length: Number }
        this.boundaryMarkers = {
            group1: { top: [], right: [], bottom: [], left: [] },
            group2: { top: [], right: [], bottom: [], left: [] }
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

        // Invalidate state inventories - will be computed on demand
        this.inventoryValid = false;

        // Initialize non-uniform grid points
        this.initializeGridPoints(this.config);

        // Create initial pattern for immediate visualization
        this.createInitialPattern();

        return {
            grid: this.grid,
            totalArea: this.totalArea,
            targetArea: this.targetArea
        };
    }

    // Initialize xPoints and yPoints as normalized arrays in [0,1]
    initializeGridPoints(config = {}) {
        const mode = config.gridPointsMode || 'random'; // 'random' | 'uniform' | 'manual'
        const xManual = config.xPoints;
        const yManual = config.yPoints;
        const jitter = typeof config.gridJitter === 'number' ? config.gridJitter : 0.35; // 0..1

        if (mode === 'manual' && Array.isArray(xManual) && Array.isArray(yManual)) {
            const valid = this.setGridPointsNormalized(xManual, yManual);
            if (valid) return;
            // Fallback if invalid
        }

        if (mode === 'uniform') {
            this.xPoints = GridCore.generateUniformPoints(this.gridSize);
            this.yPoints = GridCore.generateUniformPoints(this.gridSize);
        } else {
            // default random jittered widths
            this.xPoints = GridCore.generateRandomPoints(this.gridSize, jitter);
            this.yPoints = GridCore.generateRandomPoints(this.gridSize, jitter);
        }
    }

    // Static helper: uniform normalized grid lines [0..1]
    static generateUniformPoints(n) {
        const arr = new Array(n + 1);
        for (let i = 0; i <= n; i++) arr[i] = i / n;
        return arr;
    }

    // Static helper: random widths with jitter around uniform, normalized to [0,1]
    static generateRandomPoints(n, jitter = 0.35) {
        // Generate n positive widths that sum to 1, centered around 1/n
        // width_i = max(eps, (1/n) * (1 + noise_i)), noise ~ U(-jitter, +jitter)
        const widths = [];
        const base = 1 / n;
        const eps = 1e-6;
        for (let i = 0; i < n; i++) {
            const noise = (Math.random() * 2 - 1) * jitter;
            widths.push(Math.max(eps, base * (1 + noise)));
        }
        // Normalize to sum 1
        const sum = widths.reduce((a, b) => a + b, 0);
        const norm = widths.map(w => w / sum);
        // Build cumulative boundaries
        const points = [0];
        let acc = 0;
        for (let i = 0; i < n; i++) {
            acc += norm[i];
            points.push(acc);
        }
        points[0] = 0;
        points[points.length - 1] = 1;
        return points;
    }

    // Accept either boundaries (length n+1) in [0,1] monotonic, or widths (length n) positives
    setGridPointsNormalized(xArr, yArr) {
        const validateAndNormalize = (arr) => {
            if (!Array.isArray(arr)) return null;
            if (arr.length === this.gridSize + 1) {
                // boundaries
                const a = arr.map(Number);
                if (a.some(v => !isFinite(v))) return null;
                // Ensure 0..1 and monotonic
                for (let i = 1; i < a.length; i++) {
                    if (a[i] < a[i - 1]) return null;
                }
                const min = a[0];
                const max = a[a.length - 1];
                if (Math.abs(min) > 1e-9 || Math.abs(max - 1) > 1e-6) {
                    // Normalize to [0,1]
                    const len = max - min;
                    if (len <= 0) return null;
                    for (let i = 0; i < a.length; i++) a[i] = (a[i] - min) / len;
                }
                return a;
            } else if (arr.length === this.gridSize) {
                // widths
                const w = arr.map(Number);
                if (w.some(v => !isFinite(v) || v <= 0)) return null;
                const sum = w.reduce((p, c) => p + c, 0);
                const norm = w.map(v => v / sum);
                const points = [0];
                let acc = 0;
                for (let i = 0; i < norm.length; i++) { acc += norm[i]; points.push(acc); }
                points[points.length - 1] = 1;
                return points;
            }
            return null;
        };

        const x = validateAndNormalize(xArr);
        const y = validateAndNormalize(yArr);
        if (x && y) {
            this.xPoints = x;
            this.yPoints = y;
            return true;
        }
        return false;
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

    // Clear the grid to an empty state without creating any initial pattern.
    // Keeps grid size, targetArea, and existing non-uniform grid points intact.
    clearGrid() {
        // Create an empty grid
        this.grid = Array(this.gridSize).fill(null).map(() =>
            Array(this.gridSize).fill(this.STATES.EMPTY)
        );

        // Reset area counters
        this.totalArea = 0;

        // Invalidate inventories due to bulk change
        this.invalidateStateInventories();

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
        const result = this.initializeGrid();
        // Clamp existing markers to new grid size
        this._clampMarkersToGrid();
        return result;
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

    // =========================
    // Boundary Markers API
    // =========================

    // Public: Replace all boundary markers with provided spec
    // spec: { group1: Marker[], group2: Marker[] }
    // Marker: { side: 'top'|'right'|'bottom'|'left', start: int, length: int }
    setBoundaryMarkers(spec) {
        const sides = new Set(['top', 'right', 'bottom', 'left']);
        const normalizeMarker = (m) => {
            if (!m || !sides.has(String(m.side).toLowerCase())) return null;
            const side = String(m.side).toLowerCase();
            let start = Math.max(0, Math.floor(Number(m.start)));
            let length = Math.max(0, Math.floor(Number(m.length)));
            // Clamp length so it doesn't overflow gridSize when placed at start
            length = Math.min(length, this.gridSize - start);
            if (length <= 0) return null;
            return { side, start, length };
        };

        // Occupancy per side to ensure no overlaps across both groups
        const occ = {
            top: new Array(this.gridSize).fill(false),
            right: new Array(this.gridSize).fill(false),
            bottom: new Array(this.gridSize).fill(false),
            left: new Array(this.gridSize).fill(false)
        };

        const out = {
            group1: { top: [], right: [], bottom: [], left: [] },
            group2: { top: [], right: [], bottom: [], left: [] }
        };

        const errors = [];

        const applyGroup = (groupName, list) => {
            if (!Array.isArray(list)) return;
            for (const raw of list) {
                const m = normalizeMarker(raw);
                if (!m) {
                    errors.push(`${groupName}: invalid marker ${JSON.stringify(raw)}`);
                    continue;
                }
                // Check overlap on its side
                let overlaps = false;
                for (let i = m.start; i < m.start + m.length; i++) {
                    if (occ[m.side][i]) { overlaps = true; break; }
                }
                if (overlaps) {
                    errors.push(`${groupName}: marker overlaps on ${m.side} at [${m.start},${m.start + m.length - 1}]`);
                    continue;
                }
                // Mark occupancy and accept
                for (let i = m.start; i < m.start + m.length; i++) occ[m.side][i] = true;
                out[groupName][m.side].push(m);
            }
        };

        applyGroup('group1', spec?.group1 || []);
        applyGroup('group2', spec?.group2 || []);

        // Commit
        this.boundaryMarkers = out;
        return { ok: errors.length === 0, errors, markers: this.getBoundaryMarkers() };
    }

    // Public: Clear all markers
    clearBoundaryMarkers() {
        this.boundaryMarkers = {
            group1: { top: [], right: [], bottom: [], left: [] },
            group2: { top: [], right: [], bottom: [], left: [] }
        };
    }

    // Public: Get a deep copy of markers
    getBoundaryMarkers() {
        const copySide = (s) => s.map(m => ({ side: m.side, start: m.start, length: m.length }));
        return {
            group1: {
                top: copySide(this.boundaryMarkers.group1.top),
                right: copySide(this.boundaryMarkers.group1.right),
                bottom: copySide(this.boundaryMarkers.group1.bottom),
                left: copySide(this.boundaryMarkers.group1.left)
            },
            group2: {
                top: copySide(this.boundaryMarkers.group2.top),
                right: copySide(this.boundaryMarkers.group2.right),
                bottom: copySide(this.boundaryMarkers.group2.bottom),
                left: copySide(this.boundaryMarkers.group2.left)
            }
        };
    }

    // Internal: Clamp markers when grid size changes
    _clampMarkersToGrid() {
        const clampGroup = (group) => {
            for (const side of ['top', 'right', 'bottom', 'left']) {
                const arr = group[side];
                const clamped = [];
                const occ = new Array(this.gridSize).fill(false);
                for (const m of arr) {
                    let start = Math.max(0, Math.min(this.gridSize - 1, Math.floor(m.start)));
                    let length = Math.max(0, Math.floor(m.length));
                    length = Math.min(length, this.gridSize - start);
                    if (length <= 0) continue;
                    // Check overlap against already accepted markers for this side
                    let overlaps = false;
                    for (let i = start; i < start + length; i++) {
                        if (occ[i]) { overlaps = true; break; }
                    }
                    if (overlaps) continue;
                    for (let i = start; i < start + length; i++) occ[i] = true;
                    clamped.push({ side, start, length });
                }
                group[side] = clamped;
            }
        };

        clampGroup(this.boundaryMarkers.group1);
        clampGroup(this.boundaryMarkers.group2);
    }
}