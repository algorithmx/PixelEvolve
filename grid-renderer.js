// Grid Renderer - Canvas rendering and visual representation

export class GridRenderer {
    constructor(canvas, gridSize, config = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = gridSize;

        // Rendering configuration
        this.cellSize = config.cellSize || 20;
        this.padding = config.padding || 10;
        this.debugMode = config.debugMode || false;
    // Marker band thickness multiplier (outside grid)
    this.markerThicknessMultiplier = config.markerThicknessMultiplier || 1; // ~1x cell size by default

        // Non-uniform grid support: normalized points and computed pixel lines
        this.normXPoints = null; // length gridSize+1 in [0,1]
        this.normYPoints = null; // length gridSize+1 in [0,1]
        this.xPixels = null;     // pixel positions for vertical grid lines
        this.yPixels = null;     // pixel positions for horizontal grid lines
        this.gridOffset = this.padding; // actual draw origin for grid (updated in setup)

        // Color scheme
        this.colors = {
            empty: '#ffffff',
            full: '#2563eb',
            gridLines: '#e2e8f0',
            background: '#f8fafc',
            border: '#e2e8f0',
            // Highly visible, opaque marker colors
            markerGroup1: '#ff0000', // red
            markerGroup2: '#ffcc00'  // yellow
        };

        // Boundary markers to render
        this.boundaryMarkers = null;

        this.setupCanvas();
    }

    setupCanvas() {
        // Use fixed canvas size based on 32x32 grid with 20px cell size
        const baseGridSize = 32;
        const baseCellSize = 20;
        const fixedTotalSize = baseGridSize * baseCellSize + 2 * this.padding;

        // Calculate dynamic cell size to fit the grid in fixed canvas size
        const availableSize = fixedTotalSize - 2 * this.padding;
        this.cellSize = Math.floor(availableSize / this.gridSize);

    // Determine marker thickness outside grid and adjust canvas accordingly (~1 cell)
    this.markerThickness = Math.max(1, Math.floor(this.markerThicknessMultiplier * this.cellSize));
        // Leave gridOffset to include both padding and marker thickness
        this.gridOffset = this.padding + this.markerThickness;

        // Expand canvas to accommodate thick marker bands outside grid on all sides
        const gridPixel = this.gridSize * this.cellSize;
        const totalSizeWithMarkers = gridPixel + 2 * this.gridOffset;

        this.canvas.width = totalSizeWithMarkers;
        this.canvas.height = totalSizeWithMarkers;

        this.canvas.style.border = `1px solid ${this.colors.border}`;
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.backgroundColor = this.colors.background;
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';

        // Recompute pixel grid lines whenever canvas or cell size changes
        this.computePixelGridLines();

        this.log('Canvas dimensions set to fixed:', this.canvas.width, 'x', this.canvas.height);
        this.log('Cell size adjusted to:', this.cellSize, 'for', this.gridSize, 'x', this.gridSize, 'grid');
    }

    // Provide normalized grid points from core
    setGridPoints(xPointsNorm, yPointsNorm) {
        // Basic validation and fallback to uniform if missing
        const ensure = (arr) => {
            if (Array.isArray(arr) && arr.length === this.gridSize + 1) return arr;
            // uniform fallback
            const u = new Array(this.gridSize + 1);
            for (let i = 0; i <= this.gridSize; i++) u[i] = i / this.gridSize;
            return u;
        };
        this.normXPoints = ensure(xPointsNorm);
        this.normYPoints = ensure(yPointsNorm);
        this.computePixelGridLines();
    }

    // Compute pixel grid lines from normalized points
    computePixelGridLines() {
        const gridPixelSize = this.gridSize * this.cellSize; // drawable area
        const x0 = this.gridOffset;
        const y0 = this.gridOffset;

        // Default to uniform if not set
        const ensure = (arr) => {
            if (Array.isArray(arr) && arr.length === this.gridSize + 1) return arr;
            const u = new Array(this.gridSize + 1);
            for (let i = 0; i <= this.gridSize; i++) u[i] = i / this.gridSize;
            return u;
        };

        const nx = ensure(this.normXPoints);
        const ny = ensure(this.normYPoints);

        this.xPixels = new Array(this.gridSize + 1);
        this.yPixels = new Array(this.gridSize + 1);
        for (let i = 0; i <= this.gridSize; i++) {
            this.xPixels[i] = x0 + nx[i] * gridPixelSize;
            this.yPixels[i] = y0 + ny[i] * gridPixelSize;
        }
    }

    render(grid, states) {
        if (!grid || !states) {
            this.log('render() called but grid or states missing');
            return;
        }

        this.log('render() called');

        // Clear canvas with white background
        this.ctx.fillStyle = this.colors.empty;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        let cellCount = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.renderCell(row, col, grid[row][col], states);
                cellCount++;
            }
        }

        this.log('Rendered', cellCount, 'cells');

        this.drawGridLines();
        this.log('Grid lines drawn');

        // Draw boundary markers outside the grid if present
        if (this.boundaryMarkers) {
            this.drawBoundaryMarkers(this.boundaryMarkers);
        }
    }

    renderCell(row, col, state, states) {
        const x = this.xPixels?.[col] ?? (col * this.cellSize + this.padding);
        const y = this.yPixels?.[row] ?? (row * this.cellSize + this.padding);
        const w = (this.xPixels ? this.xPixels[col + 1] - this.xPixels[col] : this.cellSize);
        const h = (this.yPixels ? this.yPixels[row + 1] - this.yPixels[row] : this.cellSize);

        this.ctx.save();

        switch(state) {
            case states.EMPTY:
                this.ctx.fillStyle = this.colors.empty;
                this.ctx.fillRect(x, y, w, h);
                break;

            case states.FULL:
                this.ctx.fillStyle = this.colors.full;
                this.ctx.fillRect(x, y, w, h);
                break;

            case states.HALF_DIAG_TL_BR:
                this.renderDiagonalCell(x, y, w, h, 'tl-br', states);
                break;

            case states.HALF_DIAG_TR_BL:
                this.renderDiagonalCell(x, y, w, h, 'tr-bl', states);
                break;

            case states.HALF_DIAG_BL_TR:
                this.renderDiagonalCell(x, y, w, h, 'bl-tr', states);
                break;

            case states.HALF_DIAG_BR_TL:
                this.renderDiagonalCell(x, y, w, h, 'br-tl', states);
                break;

            default:
                // Unknown state - render as empty
                this.ctx.fillStyle = this.colors.empty;
                this.ctx.fillRect(x, y, w, h);
                break;
        }

        this.ctx.restore();
    }

    // Provide boundary markers for overlay rendering
    setMarkers(markers) {
        this.boundaryMarkers = markers || null;
    }

    // Draw markers along the grid edges OUTSIDE the cell area
    drawBoundaryMarkers(markers) {
        const groups = [
            { name: 'group1', color: this.colors.markerGroup1 },
            { name: 'group2', color: this.colors.markerGroup2 }
        ];
    // Use configured marker thickness (outside the grid)
    const thickness = Math.max(1, this.markerThickness|0);

        // Precompute bounds
    const x0 = this.xPixels?.[0] ?? this.gridOffset;
    const y0 = this.yPixels?.[0] ?? this.gridOffset;
    const xN = this.xPixels?.[this.gridSize] ?? (this.gridOffset + this.gridSize * this.cellSize);
    const yN = this.yPixels?.[this.gridSize] ?? (this.gridOffset + this.gridSize * this.cellSize);
        for (const g of groups) {
            const group = markers?.[g.name];
            if (!group) continue;
            this.ctx.save();
            this.ctx.fillStyle = g.color;

            // Sides: for top/bottom iterate columns segments; for left/right iterate rows segments
            const paintSide = (sideArr, side) => {
                if (!Array.isArray(sideArr)) return;
                for (const m of sideArr) {
                    if (!m) continue;
                    const start = Math.max(0, Math.min(this.gridSize - 1, m.start|0));
                    const len = Math.max(0, Math.min(this.gridSize - start, m.length|0));
                    if (len <= 0) continue;
                    if (side === 'top') {
                        const yTop = Math.max(0, y0 - thickness);
                        for (let c = start; c < start + len; c++) {
                            const xL = this.xPixels?.[c] ?? (this.padding + c * this.cellSize);
                            const xR = this.xPixels?.[c + 1] ?? (this.padding + (c + 1) * this.cellSize);
                            this.ctx.fillRect(xL, yTop, xR - xL, thickness);
                        }
                    } else if (side === 'bottom') {
                        const yBot = Math.min(this.canvas.height, yN);
                        for (let c = start; c < start + len; c++) {
                            const xL = this.xPixels?.[c] ?? (this.padding + c * this.cellSize);
                            const xR = this.xPixels?.[c + 1] ?? (this.padding + (c + 1) * this.cellSize);
                            this.ctx.fillRect(xL, yBot, xR - xL, thickness);
                        }
                    } else if (side === 'left') {
                        const xLeft = Math.max(0, x0 - thickness);
                        for (let r = start; r < start + len; r++) {
                            const yT = this.yPixels?.[r] ?? (this.padding + r * this.cellSize);
                            const yB = this.yPixels?.[r + 1] ?? (this.padding + (r + 1) * this.cellSize);
                            this.ctx.fillRect(xLeft, yT, thickness, yB - yT);
                        }
                    } else if (side === 'right') {
                        const xRight = Math.min(this.canvas.width, xN);
                        for (let r = start; r < start + len; r++) {
                            const yT = this.yPixels?.[r] ?? (this.padding + r * this.cellSize);
                            const yB = this.yPixels?.[r + 1] ?? (this.padding + (r + 1) * this.cellSize);
                            this.ctx.fillRect(xRight, yT, thickness, yB - yT);
                        }
                    }
                }
            };

            paintSide(group.top, 'top');
            paintSide(group.right, 'right');
            paintSide(group.bottom, 'bottom');
            paintSide(group.left, 'left');

            this.ctx.restore();
        }
    }

    renderDiagonalCell(x, y, w, h, direction, states) {
        const { full, empty } = this.colors;

        switch(direction) {
            case 'tl-br':
                // Top-left to bottom-right diagonal
                this.ctx.fillStyle = empty;
                this.ctx.fillRect(x, y, w, h);
                this.ctx.fillStyle = full;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + w, y + h);
                this.ctx.lineTo(x, y + h);
                this.ctx.closePath();
                this.ctx.fill();
                break;

            case 'tr-bl':
                // Top-right to bottom-left diagonal
                this.ctx.fillStyle = empty;
                this.ctx.fillRect(x, y, w, h);
                this.ctx.fillStyle = full;
                this.ctx.beginPath();
                this.ctx.moveTo(x + w, y);
                this.ctx.lineTo(x, y + h);
                this.ctx.lineTo(x + w, y + h);
                this.ctx.closePath();
                this.ctx.fill();
                break;

            case 'bl-tr':
                // Bottom-left to top-right diagonal (inverse)
                this.ctx.fillStyle = full;
                this.ctx.fillRect(x, y, w, h);
                this.ctx.fillStyle = empty;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + w, y + h);
                this.ctx.lineTo(x, y + h);
                this.ctx.closePath();
                this.ctx.fill();
                break;

            case 'br-tl':
                // Bottom-right to top-left diagonal (inverse)
                this.ctx.fillStyle = full;
                this.ctx.fillRect(x, y, w, h);
                this.ctx.fillStyle = empty;
                this.ctx.beginPath();
                this.ctx.moveTo(x + w, y);
                this.ctx.lineTo(x, y + h);
                this.ctx.lineTo(x + w, y + h);
                this.ctx.closePath();
                this.ctx.fill();
                break;
        }
    }

    drawGridLines() {
        this.ctx.strokeStyle = this.colors.gridLines;
        this.ctx.lineWidth = 1;

        const xLines = this.xPixels || Array.from({length: this.gridSize + 1}, (_, i) => i * this.cellSize + this.gridOffset);
        const yLines = this.yPixels || Array.from({length: this.gridSize + 1}, (_, i) => i * this.cellSize + this.gridOffset);

        for (let i = 0; i <= this.gridSize; i++) {
            const xPos = xLines[i];
            const yPos = yLines[i];

            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(xPos, yLines[0]);
            this.ctx.lineTo(xPos, yLines[this.gridSize]);
            this.ctx.stroke();

            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(xLines[0], yPos);
            this.ctx.lineTo(xLines[this.gridSize], yPos);
            this.ctx.stroke();
        }
    }

    // Update canvas size for new grid dimensions
    resize(newGridSize, newCellSize = null) {
        this.gridSize = newGridSize;
        // newCellSize parameter is ignored - cell size will be calculated in setupCanvas()
        this.setupCanvas();
    }

    // Set custom colors
    setColors(colorScheme) {
        Object.assign(this.colors, colorScheme);
    }

    // Clear canvas to background color
    clear() {
        this.ctx.fillStyle = this.colors.empty;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Get cell coordinates from canvas position
    getCellFromCanvasPosition(canvasX, canvasY) {
        const within = (val, arr) => val >= arr[0] && val <= arr[arr.length - 1];

        if (this.xPixels && this.yPixels) {
            const x = canvasX;
            const y = canvasY;
            if (!within(x, this.xPixels) || !within(y, this.yPixels)) {
                return { row: -1, col: -1, valid: false };
            }
            // Binary search for col
            let lo = 0, hi = this.gridSize;
            let colIdx;
            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                const x0 = this.xPixels[mid];
                const x1 = this.xPixels[mid + 1];
                if (x < x0) hi = mid - 1;
                else if (x >= x1) lo = mid + 1;
                else { colIdx = mid; break; }
            }
            if (typeof colIdx === 'undefined') return { row: -1, col: -1, valid: false };
            // Binary search for row
            lo = 0; hi = this.gridSize;
            let rowIdx;
            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                const y0 = this.yPixels[mid];
                const y1 = this.yPixels[mid + 1];
                if (y < y0) hi = mid - 1;
                else if (y >= y1) lo = mid + 1;
                else { rowIdx = mid; break; }
            }
            if (typeof rowIdx === 'undefined') return { row: -1, col: -1, valid: false };
            return { row: rowIdx, col: colIdx, valid: true };
        }

        // Fallback to uniform mapping
        const x = canvasX - this.gridOffset;
        const y = canvasY - this.gridOffset;
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
            return { row, col, valid: true };
        }
        return { row, col, valid: false };
    }

    // Highlight a specific cell
    highlightCell(row, col, color = 'rgba(255, 0, 0, 0.3)') {
        if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) {
            return;
        }

        const x = this.xPixels?.[col] ?? (col * this.cellSize + this.gridOffset);
        const y = this.yPixels?.[row] ?? (row * this.cellSize + this.gridOffset);
        const w = (this.xPixels ? this.xPixels[col + 1] - this.xPixels[col] : this.cellSize);
        const h = (this.yPixels ? this.yPixels[row + 1] - this.yPixels[row] : this.cellSize);

        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
        this.ctx.restore();
    }

    // Add overlay effects (like temperature visualization)
    renderOverlay(data, colorScale) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.6;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (data[row] && data[row][col] !== undefined) {
                    const value = data[row][col];
                    const color = colorScale(value);

                    const x = this.xPixels?.[col] ?? (col * this.cellSize + this.padding);
                    const y = this.yPixels?.[row] ?? (row * this.cellSize + this.padding);
                    const w = (this.xPixels ? this.xPixels[col + 1] - this.xPixels[col] : this.cellSize);
                    const h = (this.yPixels ? this.yPixels[row + 1] - this.yPixels[row] : this.cellSize);

                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(x, y, w, h);
                }
            }
        }

        this.ctx.restore();
    }

    // Export canvas as image
    exportAsImage(format = 'png') {
        return this.canvas.toDataURL(`image/${format}`);
    }

    log(...args) {
        if (this.debugMode) {
            console.log('[GridRenderer]', ...args);
        }
    }
}