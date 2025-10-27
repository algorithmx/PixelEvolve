// UI Controller - UI updates and event handling

import { SimulationStatus } from './simulation-status.js';

export class UIController {
    constructor(config = {}) {
        this.debugMode = config.debugMode || false;

        // UI element selectors
        this.selectors = {
            stepCounter: '#step-counter',
            costDisplay: '#cost-display',
            costLabel: '.cost-label',
            statusDisplay: '#status-display',
            areaDisplay: '#area-display',
            targetArea: '#target-area',
            startBtn: '#start-btn',
            pauseBtn: '#pause-btn',
            resumeBtn: '#resume-btn',
            stepBtn: '#step-btn',
            resetBtn: '#reset-btn',
            randomBtn: '#random-btn',
            gridCanvas: '#grid-canvas',
            gridSizeSelect: '#grid-size-select',
            speedSlider: '#speed-slider',
            speedValue: '#speed-value',
                        annealingControls: '#annealing-controls',
            temperatureSlider: '#temperature-slider',
            temperatureValue: '#temperature-value',
            coolingRateSlider: '#cooling-rate-slider',
            coolingRateValue: '#cooling-rate-value',
            areaPreservationCheckbox: '#area-preservation',
            edgeWeightSlider: '#edge-weight',
            edgeWeightValue: '#edge-weight-value',
            cornerWeightSlider: '#corner-weight',
            cornerWeightValue: '#corner-weight-value',
                        zebraWeightSlider: '#zebra-weight',
            zebraWeightValue: '#zebra-weight-value',
            holeIsolationWeightSlider: '#hole-isolation-weight',
            holeIsolationWeightValue: '#hole-isolation-weight-value',
            presetSelect: '#preset-select',
            maxStepsSlider: '#max-steps',
            maxStepsValue: '#max-steps-value'
        };

        // Initialize status monitoring
        this.initializeStatusMonitoring();

        this.log('UI Controller initialized');
    }

    // Initialize simulation status monitoring
    initializeStatusMonitoring() {
        // Update UI when status changes
        SimulationStatus.onStatusChange((status) => {
            this.updateButtonStatesFromStatus(status);
            this.updateStatus(SimulationStatus.getDisplayText());
        });
    }

    // Get DOM element safely
    getElement(selector) {
        return document.querySelector(selector);
    }

    // Get all DOM elements matching selector
    getElements(selector) {
        return document.querySelectorAll(selector);
    }

    // Update step counter
    updateStepCounter(step) {
        const element = this.getElement(this.selectors.stepCounter);
        if (element) {
            element.textContent = step;
        }
    }

    // Update cost/energy display
    updateCostDisplay(value, isEnergy = false) {
        const element = this.getElement(this.selectors.costDisplay);
        if (element) {
            element.textContent = value.toFixed(3);
        }

        // Update label
        const labelElement = this.getElement(this.selectors.costLabel);
        if (labelElement) {
            const label = isEnergy ? 'Energy' : 'Cost';
            labelElement.textContent = label + ':';
        }
    }

    // Update status display
    updateStatus(status, isAnnealing = false, temperature = 0) {
        const element = this.getElement(this.selectors.statusDisplay);
        if (element) {
            let fullStatus = status;
            if (isAnnealing && status === 'Running') {
                fullStatus += ` (T=${temperature.toFixed(3)})`;
            }
            element.textContent = fullStatus;
        }
    }

    // Update area display
    updateAreaDisplay(currentArea, targetArea) {
        const areaElement = this.getElement(this.selectors.areaDisplay);
        const targetElement = this.getElement(this.selectors.targetArea);

        if (areaElement) {
            areaElement.textContent = `${currentArea.toFixed(1)} / ${targetArea}`;
        }
        if (targetElement) {
            targetElement.textContent = targetArea;
        }
    }

    // Update button states based on simulation status
    updateButtonStatesFromStatus(status) {
        const startBtn = this.getElement(this.selectors.startBtn);
        const pauseBtn = this.getElement(this.selectors.pauseBtn);
        const resumeBtn = this.getElement(this.selectors.resumeBtn);
        const stepBtn = this.getElement(this.selectors.stepBtn);

        // Default: enable all, then disable based on status
        this.setButtonState(startBtn, false);
        this.setButtonState(pauseBtn, false);
        this.setButtonState(resumeBtn, false);
        this.setButtonState(stepBtn, false);

        switch (status) {
            case SimulationStatus.STATUS.IDLE:
            case SimulationStatus.STATUS.STOPPED:
                // Can start, can step
                this.setButtonState(startBtn, false);
                this.setButtonState(stepBtn, false);
                break;

            case SimulationStatus.STATUS.RUNNING:
                // Can pause, cannot start or step
                this.setButtonState(pauseBtn, false);
                break;

            case SimulationStatus.STATUS.PAUSED:
                // Can resume or start fresh, can step
                this.setButtonState(startBtn, false);
                this.setButtonState(resumeBtn, false);
                this.setButtonState(stepBtn, false);
                break;
        }
    }

    // Update button states based on evolution status (legacy method)
    updateButtonStates(isRunning) {
        if (isRunning) {
            SimulationStatus.setStatus(SimulationStatus.STATUS.RUNNING);
        } else {
            SimulationStatus.setStatus(SimulationStatus.STATUS.STOPPED);
        }
    }

    // Helper to set button state
    setButtonState(button, disabled) {
        if (button) {
            button.disabled = disabled;
            if (disabled) {
                button.classList.add('opacity-50');
            } else {
                button.classList.remove('opacity-50');
            }
        }
    }

    // Update speed display
    updateSpeedDisplay(speed) {
        const element = this.getElement(this.selectors.speedValue);
        if (element) {
            element.textContent = speed + 'ms';
        }
    }

    // Update temperature display
    updateTemperatureDisplay(temperature) {
        const valueElement = this.getElement(this.selectors.temperatureValue);
        if (valueElement) {
            valueElement.textContent = temperature.toFixed(3);
        }

        // Update temperature slider position to reflect actual temperature
        const sliderElement = this.getElement(this.selectors.temperatureSlider);
        if (sliderElement) {
            // Store user interaction state to avoid interfering with manual changes
            const isUserChanging = sliderElement.dataset.userChanging === 'true';

            if (!isUserChanging) {
                // Ensure temperature is within slider bounds
                const min = parseFloat(sliderElement.min) || 0.001;
                const max = parseFloat(sliderElement.max) || 5;
                const clampedTemperature = Math.max(min, Math.min(max, temperature));
                sliderElement.value = clampedTemperature;
            }
        }
    }

    // Update cooling rate display
    updateCoolingRateDisplay(coolingRate) {
        const element = this.getElement(this.selectors.coolingRateValue);
        if (element) {
            element.textContent = coolingRate.toFixed(3);
        }
    }

    // Update energy weight displays
    updateEdgeWeightDisplay(weight) {
        const element = this.getElement(this.selectors.edgeWeightValue);
        if (element) {
            element.textContent = weight.toFixed(1);
        }
    }

    updateCornerWeightDisplay(weight) {
        const element = this.getElement(this.selectors.cornerWeightValue);
        if (element) {
            element.textContent = weight.toFixed(1);
        }
    }

    
    updateZebraWeightDisplay(weight) {
        const element = this.getElement(this.selectors.zebraWeightValue);
        if (element) {
            element.textContent = weight.toFixed(1);
        }
    }

    updateHoleIsolationWeightDisplay(weight) {
        const element = this.getElement(this.selectors.holeIsolationWeightValue);
        if (element) {
            element.textContent = weight.toFixed(1);
        }
    }

    // Update max steps display
    updateMaxStepsDisplay(maxSteps) {
        const element = this.getElement(this.selectors.maxStepsValue);
        if (element) {
            element.textContent = maxSteps;
        }
    }

    // Show/hide annealing controls
    toggleAnnealingControls(show) {
        const controls = this.getElement(this.selectors.annealingControls);
        if (controls) {
            controls.style.display = show ? 'block' : 'none';
        }
    }

    // Bind event handlers
    bindEventHandlers(handlers) {
        // Start/Pause buttons
        const startBtn = this.getElement(this.selectors.startBtn);
        if (startBtn && handlers.onStart) {
            startBtn.addEventListener('click', handlers.onStart);
        }

        const pauseBtn = this.getElement(this.selectors.pauseBtn);
        if (pauseBtn && handlers.onPause) {
            pauseBtn.addEventListener('click', handlers.onPause);
        }

        const resumeBtn = this.getElement(this.selectors.resumeBtn);
        if (resumeBtn && handlers.onResume) {
            resumeBtn.addEventListener('click', handlers.onResume);
        }

        const stepBtn = this.getElement(this.selectors.stepBtn);
        if (stepBtn && handlers.onStep) {
            stepBtn.addEventListener('click', handlers.onStep);
        }

        // Reset and Random buttons
        const resetBtn = this.getElement(this.selectors.resetBtn);
        if (resetBtn && handlers.onReset) {
            resetBtn.addEventListener('click', handlers.onReset);
        }

        const randomBtn = this.getElement(this.selectors.randomBtn);
        if (randomBtn && handlers.onRandomize) {
            randomBtn.addEventListener('click', handlers.onRandomize);
        }

        // Grid size
        const gridSizeSelect = this.getElement(this.selectors.gridSizeSelect);
        if (gridSizeSelect && handlers.onGridSizeChange) {
            gridSizeSelect.addEventListener('change', (e) => {
                const newSize = parseInt(e.target.value);
                handlers.onGridSizeChange(newSize);
            });
        }

        // Evolution speed
        const speedSlider = this.getElement(this.selectors.speedSlider);
        if (speedSlider && handlers.onSpeedChange) {
            speedSlider.addEventListener('input', (e) => {
                const speed = parseInt(e.target.value);
                handlers.onSpeedChange(speed);
            });
        }

        
        // Temperature control
        const temperatureSlider = this.getElement(this.selectors.temperatureSlider);
        if (temperatureSlider && handlers.onTemperatureChange) {
            temperatureSlider.addEventListener('mousedown', () => {
                temperatureSlider.dataset.userChanging = 'true';
            });

            temperatureSlider.addEventListener('mouseup', () => {
                temperatureSlider.dataset.userChanging = 'false';
            });

            temperatureSlider.addEventListener('touchstart', () => {
                temperatureSlider.dataset.userChanging = 'true';
            });

            temperatureSlider.addEventListener('touchend', () => {
                temperatureSlider.dataset.userChanging = 'false';
            });

            temperatureSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                handlers.onTemperatureChange(value);
            });
        }

        // Cooling rate control
        const coolingRateSlider = this.getElement(this.selectors.coolingRateSlider);
        if (coolingRateSlider && handlers.onCoolingRateChange) {
            coolingRateSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                handlers.onCoolingRateChange(value);
            });
        }

        // Area preservation
        const areaPreservationCheckbox = this.getElement(this.selectors.areaPreservationCheckbox);
        if (areaPreservationCheckbox && handlers.onAreaPreservationChange) {
            areaPreservationCheckbox.addEventListener('change', (e) => {
                handlers.onAreaPreservationChange(e.target.checked);
            });
        }

  
        // Energy weight sliders
        const edgeWeightSlider = this.getElement(this.selectors.edgeWeightSlider);
        if (edgeWeightSlider && handlers.onEdgeWeightChange) {
            edgeWeightSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                handlers.onEdgeWeightChange(value);
            });
        }

        const cornerWeightSlider = this.getElement(this.selectors.cornerWeightSlider);
        if (cornerWeightSlider && handlers.onCornerWeightChange) {
            cornerWeightSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                handlers.onCornerWeightChange(value);
            });
        }

        
        const zebraWeightSlider = this.getElement(this.selectors.zebraWeightSlider);
        if (zebraWeightSlider && handlers.onZebraWeightChange) {
            zebraWeightSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                handlers.onZebraWeightChange(value);
            });
        }

        const holeIsolationWeightSlider = this.getElement(this.selectors.holeIsolationWeightSlider);
        if (holeIsolationWeightSlider && handlers.onHoleIsolationWeightChange) {
            holeIsolationWeightSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                handlers.onHoleIsolationWeightChange(value);
            });
        }

        // Max steps
        const maxStepsSlider = this.getElement(this.selectors.maxStepsSlider);
        if (maxStepsSlider && handlers.onMaxStepsChange) {
            maxStepsSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                handlers.onMaxStepsChange(value);
            });
        }

        // Presets
        const presetSelect = this.getElement(this.selectors.presetSelect);
        if (presetSelect && handlers.onPresetChange) {
            presetSelect.addEventListener('change', (e) => {
                handlers.onPresetChange(e.target.value);
            });
        }

        this.log('Event handlers bound');
    }

    // Bind canvas click handler
    bindCanvasClickHandler(canvas, handler) {
        if (canvas && handler) {
            canvas.addEventListener('click', handler);
            this.log('Canvas click handler bound');
        }
    }

    // Bind drag-and-drop rectangle drawing to canvas
    bindDragRectangleHandler(canvas, gridRenderer, gridCore, onRectangleDrawn) {
        if (!canvas || !gridRenderer || !gridCore) {
            this.log('Missing required components for drag rectangle handler');
            return;
        }

        let isDragging = false;
        let startX, startY;
        let currentRect = null;

        const getMousePos = (e) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const drawPreview = (startCell, endCell) => {
            // Re-render the grid first
            if (this.currentGrid && this.currentStates) {
                gridRenderer.render(this.currentGrid, this.currentStates);
            }

            // Draw preview rectangle
            const minRow = Math.min(startCell.row, endCell.row);
            const maxRow = Math.max(startCell.row, endCell.row);
            const minCol = Math.min(startCell.col, endCell.col);
            const maxCol = Math.max(startCell.col, endCell.col);

            for (let row = minRow; row <= maxRow; row++) {
                for (let col = minCol; col <= maxCol; col++) {
                    gridRenderer.highlightCell(row, col, 'rgba(37, 99, 235, 0.3)');
                }
            }
        };

        canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left click

            const mousePos = getMousePos(e);
            const cell = gridRenderer.getCellFromCanvasPosition(mousePos.x, mousePos.y);

            if (cell.valid) {
                isDragging = true;
                startX = cell.col;
                startY = cell.row;
                canvas.style.cursor = 'crosshair';
                e.preventDefault();
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const mousePos = getMousePos(e);
            const cell = gridRenderer.getCellFromCanvasPosition(mousePos.x, mousePos.y);

            if (cell.valid) {
                const endCell = { row: cell.row, col: cell.col };
                drawPreview({ row: startY, col: startX }, endCell);
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (!isDragging) return;

            isDragging = false;
            canvas.style.cursor = 'default';

            const mousePos = getMousePos(e);
            const cell = gridRenderer.getCellFromCanvasPosition(mousePos.x, mousePos.y);

            if (cell.valid) {
                const endRow = cell.row;
                const endCol = cell.col;

                // Fill rectangle with FULL state
                const minRow = Math.min(startY, endRow);
                const maxRow = Math.max(startY, endRow);
                const minCol = Math.min(startX, endCol);
                const maxCol = Math.max(startX, endCol);

                // Fill the rectangle
                for (let row = minRow; row <= maxRow; row++) {
                    for (let col = minCol; col <= maxCol; col++) {
                        gridCore.setCell(row, col, 1); // 1 = FULL state
                    }
                }

                // Final render
                if (this.currentGrid && this.currentStates) {
                    gridRenderer.render(this.currentGrid, this.currentStates);
                }

                // Callback if provided
                if (onRectangleDrawn) {
                    onRectangleDrawn(minRow, minCol, maxRow - minRow + 1, maxCol - minCol + 1);
                }
            }
        });

        canvas.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                canvas.style.cursor = 'default';
                // Re-render to clear preview
                if (this.currentGrid && this.currentStates) {
                    gridRenderer.render(this.currentGrid, this.currentStates);
                }
            }
        });

        this.log('Drag rectangle handler bound to canvas');
    }

    // Store current grid reference for drag preview
    setGridReference(grid, states) {
        this.currentGrid = grid;
        this.currentStates = states;
    }

    // Update all UI elements at once
    updateUI(data) {
        if (data.step !== undefined) {
            this.updateStepCounter(data.step);
        }

        if (data.cost !== undefined || data.energy !== undefined) {
            const value = data.energy !== undefined ? data.energy : data.cost;
            const isEnergy = data.energy !== undefined;
            this.updateCostDisplay(value, isEnergy);
        }

        if (data.status !== undefined) {
            this.updateStatus(data.status, data.isAnnealing, data.temperature);
        }

        if (data.currentArea !== undefined && data.targetArea !== undefined) {
            this.updateAreaDisplay(data.currentArea, data.targetArea);
        }

        if (data.isRunning !== undefined) {
            this.updateButtonStates(data.isRunning);
        }

        if (data.speed !== undefined) {
            this.updateSpeedDisplay(data.speed);
        }

        if (data.temperature !== undefined) {
            this.updateTemperatureDisplay(data.temperature);
        }

        if (data.coolingRate !== undefined) {
            this.updateCoolingRateDisplay(data.coolingRate);
        }

        if (data.maxSteps !== undefined) {
            this.updateMaxStepsDisplay(data.maxSteps);
        }

        
        if (data.showAnnealingControls !== undefined) {
            this.toggleAnnealingControls(data.showAnnealingControls);
        }

        // Energy weights
        if (data.edgeWeight !== undefined) {
            this.updateEdgeWeightDisplay(data.edgeWeight);
        }

        if (data.cornerWeight !== undefined) {
            this.updateCornerWeightDisplay(data.cornerWeight);
        }

        
        if (data.zebraWeight !== undefined) {
            this.updateZebraWeightDisplay(data.zebraWeight);
        }

        if (data.holeIsolationWeight !== undefined) {
            this.updateHoleIsolationWeightDisplay(data.holeIsolationWeight);
        }
    }

    // Get current values from UI controls
    getUIValues() {
        return {
            gridSize: parseInt(this.getElement(this.selectors.gridSizeSelect)?.value || '32'),
            evolutionSpeed: parseInt(this.getElement(this.selectors.speedSlider)?.value || '2'),
            temperature: parseFloat(this.getElement(this.selectors.temperatureSlider)?.value || '1.0'),
            coolingRate: parseFloat(this.getElement(this.selectors.coolingRateSlider)?.value || '0.995'),
            areaPreservation: this.getElement(this.selectors.areaPreservationCheckbox)?.checked !== false,
            edgeWeight: parseFloat(this.getElement(this.selectors.edgeWeightSlider)?.value || '2.5'),
            cornerWeight: parseFloat(this.getElement(this.selectors.cornerWeightSlider)?.value || '1.8'),
                        zebraWeight: parseFloat(this.getElement(this.selectors.zebraWeightSlider)?.value || '2.5'),
            holeIsolationWeight: parseFloat(this.getElement(this.selectors.holeIsolationWeightSlider)?.value || '2.5'),
            maxSteps: parseInt(this.getElement(this.selectors.maxStepsSlider)?.value || '1000')
        };
    }

    // Show error message
    showError(message) {
        const container = this.getElement(this.selectors.gridCanvas)?.parentElement;
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; border: 2px solid red; background: #ffebee;">
                    <h3 style="color: red;">Grid Visualization Error</h3>
                    <p>${message}</p>
                    <p><button onclick="location.reload()" style="margin-top: 10px; padding: 10px;">Reload Page</button></p>
                </div>
            `;
        }
    }

    // Hide loading indicator
    hideLoadingIndicator() {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    log(...args) {
        if (this.debugMode) {
            console.log('[UIController]', ...args);
        }
    }
}