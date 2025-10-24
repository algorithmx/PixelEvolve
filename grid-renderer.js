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

        // Color scheme
        this.colors = {
            empty: '#ffffff',
            full: '#2563eb',
            gridLines: '#e2e8f0',
            background: '#f8fafc',
            border: '#e2e8f0'
        };

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

        this.canvas.width = fixedTotalSize;
        this.canvas.height = fixedTotalSize;

        this.canvas.style.border = `1px solid ${this.colors.border}`;
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.backgroundColor = this.colors.background;
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';

        this.log('Canvas dimensions set to fixed:', this.canvas.width, 'x', this.canvas.height);
        this.log('Cell size adjusted to:', this.cellSize, 'for', this.gridSize, 'x', this.gridSize, 'grid');
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
    }

    renderCell(row, col, state, states) {
        const x = col * this.cellSize + this.padding;
        const y = row * this.cellSize + this.padding;

        this.ctx.save();

        switch(state) {
            case states.EMPTY:
                this.ctx.fillStyle = this.colors.empty;
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                break;

            case states.FULL:
                this.ctx.fillStyle = this.colors.full;
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                break;

            case states.HALF_DIAG_TL_BR:
                this.renderDiagonalCell(x, y, 'tl-br', states);
                break;

            case states.HALF_DIAG_TR_BL:
                this.renderDiagonalCell(x, y, 'tr-bl', states);
                break;

            case states.HALF_DIAG_BL_TR:
                this.renderDiagonalCell(x, y, 'bl-tr', states);
                break;

            case states.HALF_DIAG_BR_TL:
                this.renderDiagonalCell(x, y, 'br-tl', states);
                break;

            default:
                // Unknown state - render as empty
                this.ctx.fillStyle = this.colors.empty;
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                break;
        }

        this.ctx.restore();
    }

    renderDiagonalCell(x, y, direction, states) {
        const { full, empty } = this.colors;

        switch(direction) {
            case 'tl-br':
                // Top-left to bottom-right diagonal
                this.ctx.fillStyle = empty;
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                this.ctx.fillStyle = full;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + this.cellSize, y + this.cellSize);
                this.ctx.lineTo(x, y + this.cellSize);
                this.ctx.closePath();
                this.ctx.fill();
                break;

            case 'tr-bl':
                // Top-right to bottom-left diagonal
                this.ctx.fillStyle = empty;
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                this.ctx.fillStyle = full;
                this.ctx.beginPath();
                this.ctx.moveTo(x + this.cellSize, y);
                this.ctx.lineTo(x, y + this.cellSize);
                this.ctx.lineTo(x + this.cellSize, y + this.cellSize);
                this.ctx.closePath();
                this.ctx.fill();
                break;

            case 'bl-tr':
                // Bottom-left to top-right diagonal (inverse)
                this.ctx.fillStyle = full;
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                this.ctx.fillStyle = empty;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + this.cellSize, y + this.cellSize);
                this.ctx.lineTo(x, y + this.cellSize);
                this.ctx.closePath();
                this.ctx.fill();
                break;

            case 'br-tl':
                // Bottom-right to top-left diagonal (inverse)
                this.ctx.fillStyle = full;
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                this.ctx.fillStyle = empty;
                this.ctx.beginPath();
                this.ctx.moveTo(x + this.cellSize, y);
                this.ctx.lineTo(x, y + this.cellSize);
                this.ctx.lineTo(x + this.cellSize, y + this.cellSize);
                this.ctx.closePath();
                this.ctx.fill();
                break;
        }
    }

    drawGridLines() {
        this.ctx.strokeStyle = this.colors.gridLines;
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= this.gridSize; i++) {
            const pos = i * this.cellSize + this.padding;

            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(pos, this.padding);
            this.ctx.lineTo(pos, this.gridSize * this.cellSize + this.padding);
            this.ctx.stroke();

            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, pos);
            this.ctx.lineTo(this.gridSize * this.cellSize + this.padding, pos);
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
        const x = canvasX - this.padding;
        const y = canvasY - this.padding;

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

        const x = col * this.cellSize + this.padding;
        const y = row * this.cellSize + this.padding;

        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
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

                    const x = col * this.cellSize + this.padding;
                    const y = row * this.cellSize + this.padding;

                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
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