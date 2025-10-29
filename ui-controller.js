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
            snapshotBtn: '#snapshot-btn',
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
            neighborWeightSlider: '#neighbor-weight',
            neighborWeightValue: '#neighbor-weight-value',
            holeIsolationWeightSlider: '#hole-isolation-weight',
            holeIsolationWeightValue: '#hole-isolation-weight-value',
            isingWeightSlider: '#ising-weight',
            isingWeightValue: '#ising-weight-value',
            isingJ1Slider: '#ising-j1',
            isingJ1Value: '#ising-j1-value',
            isingJ2Slider: '#ising-j2',
            isingJ2Value: '#ising-j2-value',
            presetSelect: '#preset-select',
            maxStepsSlider: '#max-steps',
            maxStepsValue: '#max-steps-value',
            // Non-uniform grid controls
            gridXPointsInput: '#grid-x-points',
            gridYPointsInput: '#grid-y-points',
            gridPointsApplyBtn: '#grid-points-apply',
            gridPointsRandomBtn: '#grid-points-random',
            gridPointsUniformBtn: '#grid-points-uniform',
            gridPointsJitterSlider: '#grid-points-jitter',
            gridPointsJitterValue: '#grid-points-jitter-value'
            ,
            // Boundary markers controls
            markersGroup1Input: '#markers-group1',
            markersGroup2Input: '#markers-group2',
            markersApplyBtn: '#markers-apply',
            markersClearBtn: '#markers-clear'
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

    updateNeighborWeightDisplay(weight) {
        const element = this.getElement(this.selectors.neighborWeightValue);
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

    updateIsingWeightDisplay(weight) {
        const element = this.getElement(this.selectors.isingWeightValue);
        if (element) {
            element.textContent = weight.toFixed(1);
        }
    }

    updateIsingJ1Display(value) {
        const element = this.getElement(this.selectors.isingJ1Value);
        if (element) {
            element.textContent = value.toFixed(1);
        }
    }

    updateIsingJ2Display(value) {
        const element = this.getElement(this.selectors.isingJ2Value);
        if (element) {
            element.textContent = value.toFixed(1);
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

        const snapshotBtn = this.getElement(this.selectors.snapshotBtn);
        if (snapshotBtn && handlers.onSnapshot) {
            snapshotBtn.addEventListener('click', handlers.onSnapshot);
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

        const neighborWeightSlider = this.getElement(this.selectors.neighborWeightSlider);
        if (neighborWeightSlider && handlers.onNeighborWeightChange) {
            neighborWeightSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                handlers.onNeighborWeightChange(value);
            });
        }

        const holeIsolationWeightSlider = this.getElement(this.selectors.holeIsolationWeightSlider);
        if (holeIsolationWeightSlider && handlers.onHoleIsolationWeightChange) {
            holeIsolationWeightSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                handlers.onHoleIsolationWeightChange(value);
            });
        }

        const isingWeightSlider = this.getElement(this.selectors.isingWeightSlider);
        if (isingWeightSlider && handlers.onIsingWeightChange) {
            isingWeightSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                handlers.onIsingWeightChange(value);
            });
        }

        const isingJ1Slider = this.getElement(this.selectors.isingJ1Slider);
        if (isingJ1Slider && handlers.onIsingJ1Change) {
            isingJ1Slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                handlers.onIsingJ1Change(value);
            });
        }

        const isingJ2Slider = this.getElement(this.selectors.isingJ2Slider);
        if (isingJ2Slider && handlers.onIsingJ2Change) {
            isingJ2Slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                handlers.onIsingJ2Change(value);
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

        // Non-uniform grid controls
        const applyBtn = this.getElement(this.selectors.gridPointsApplyBtn);
        if (applyBtn && handlers.onGridPointsApply) {
            applyBtn.addEventListener('click', () => {
                const { xPoints, yPoints, error } = this.getGridPointsInputs();
                if (error) {
                    this.showMessage(error, 'error');
                } else {
                    handlers.onGridPointsApply({ xPoints, yPoints });
                }
            });
        }

    const gridRandomBtn = this.getElement(this.selectors.gridPointsRandomBtn);
        const jitterSlider = this.getElement(this.selectors.gridPointsJitterSlider);
        const jitterValue = this.getElement(this.selectors.gridPointsJitterValue);
        if (jitterSlider) {
            jitterSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (jitterValue) jitterValue.textContent = val.toFixed(2);
            });
        }
        if (gridRandomBtn && handlers.onGridPointsRandom) {
            gridRandomBtn.addEventListener('click', () => {
                const val = parseFloat(jitterSlider?.value || '0.35');
                handlers.onGridPointsRandom(isFinite(val) ? val : 0.35);
            });
        }

        const uniformBtn = this.getElement(this.selectors.gridPointsUniformBtn);
        if (uniformBtn && handlers.onGridPointsUniform) {
            uniformBtn.addEventListener('click', () => handlers.onGridPointsUniform());
        }

        // Boundary markers controls
        const markersApply = this.getElement(this.selectors.markersApplyBtn);
        if (markersApply && handlers.onMarkersApply) {
            markersApply.addEventListener('click', () => {
                const parseResult = this.getMarkerInputs();
                if (parseResult.error) {
                    this.showMessage(parseResult.error, 'error');
                } else {
                    handlers.onMarkersApply(parseResult.spec);
                }
            });
        }

        const markersClear = this.getElement(this.selectors.markersClearBtn);
        if (markersClear && handlers.onMarkersClear) {
            markersClear.addEventListener('click', () => handlers.onMarkersClear());
        }

        this.log('Event handlers bound');
    }

    // Parse grid points from UI inputs; accept either N+1 boundaries or N widths
    getGridPointsInputs() {
        const xText = this.getElement(this.selectors.gridXPointsInput)?.value || '';
        const yText = this.getElement(this.selectors.gridYPointsInput)?.value || '';
        const parse = (txt) => txt
            .split(/[,\s]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .map(Number);
        try {
            const x = parse(xText);
            const y = parse(yText);
            if (x.length === 0 || y.length === 0) {
                return { error: 'Please enter X and Y grid points.' };
            }
            return { xPoints: x, yPoints: y };
        } catch (e) {
            return { error: 'Invalid number format in grid points.' };
        }
    }

    // Parse boundary marker inputs from UI into spec
    // Input format per group: comma-separated entries like "top:0-4" or "left:3:5"
    // Returns { spec: {group1: Marker[], group2: Marker[] } } or { error }
    getMarkerInputs() {
        const g1Text = this.getElement(this.selectors.markersGroup1Input)?.value || '';
        const g2Text = this.getElement(this.selectors.markersGroup2Input)?.value || '';

        const parseGroup = (text) => {
            const entries = text.split(',').map(s => s.trim()).filter(Boolean);
            const markers = [];
            for (const e of entries) {
                const m = this.parseMarkerEntry(e);
                if (!m) return { error: `Invalid marker entry: "${e}"` };
                markers.push(m);
            }
            return { markers };
        };

        const r1 = parseGroup(g1Text);
        if (r1.error) return { error: r1.error };
        const r2 = parseGroup(g2Text);
        if (r2.error) return { error: r2.error };

        return { spec: { group1: r1.markers, group2: r2.markers } };
    }

    // Parse a single marker entry string into {side,start,length}
    parseMarkerEntry(entry) {
        if (!entry) return null;
        const sides = ['top','right','bottom','left'];
        const [sideRaw, restRaw] = entry.split(':').map(s => s.trim());
        const side = sideRaw?.toLowerCase();
        if (!sides.includes(side) || !restRaw) return null;
        // Support two forms: start-end (inclusive), or start:length
        let start, length;
        if (restRaw.includes('-')) {
            const [a, b] = restRaw.split('-').map(s => parseInt(s.trim(), 10));
            if (!isFinite(a) || !isFinite(b)) return null;
            start = Math.min(a, b);
            const end = Math.max(a, b);
            length = end - start + 1;
        } else if (restRaw.includes(':')) {
            const [a, b] = restRaw.split(':').map(s => parseInt(s.trim(), 10));
            if (!isFinite(a) || !isFinite(b)) return null;
            start = a; length = b;
        } else {
            // Also allow start only -> length 1
            const a = parseInt(restRaw, 10);
            if (!isFinite(a)) return null;
            start = a; length = 1;
        }
        return { side, start, length };
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
        let dragMode = null; // 'fill' or 'erase'

        const getMousePos = (e) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const drawPreview = (startCell, endCell, mode = 'fill') => {
            // Re-render the grid first
            if (this.currentGrid && this.currentStates) {
                gridRenderer.render(this.currentGrid, this.currentStates);
            }

            // Draw preview rectangle
            const minRow = Math.min(startCell.row, endCell.row);
            const maxRow = Math.max(startCell.row, endCell.row);
            const minCol = Math.min(startCell.col, endCell.col);
            const maxCol = Math.max(startCell.col, endCell.col);

            const color = mode === 'erase' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(37, 99, 235, 0.3)';
            for (let row = minRow; row <= maxRow; row++) {
                for (let col = minCol; col <= maxCol; col++) {
                    gridRenderer.highlightCell(row, col, color);
                }
            }
        };

        const applyRectangle = (minRow, minCol, maxRow, maxCol, mode = 'fill') => {
            const targetState = mode === 'erase' ? gridCore.STATES.EMPTY : gridCore.STATES.FULL;
            for (let row = minRow; row <= maxRow; row++) {
                for (let col = minCol; col <= maxCol; col++) {
                    gridCore.setCell(row, col, targetState);
                }
            }
        };

        canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left click
            // Require Ctrl to initiate drag drawing
            if (!e.ctrlKey) {
                // Let normal click handler process this
                return;
            }

            const mousePos = getMousePos(e);
            const cell = gridRenderer.getCellFromCanvasPosition(mousePos.x, mousePos.y);

            if (cell.valid) {
                isDragging = true;
                dragMode = e.shiftKey ? 'erase' : 'fill';
                startX = cell.col;
                startY = cell.row;
                canvas.style.cursor = 'crosshair';
                e.preventDefault();
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            // If Ctrl is released during drag, cancel the drag and clear preview
            if (!e.ctrlKey) {
                isDragging = false;
                dragMode = null;
                canvas.style.cursor = 'default';
                if (this.currentGrid && this.currentStates) {
                    gridRenderer.render(this.currentGrid, this.currentStates);
                }
                return;
            }
            // If erase mode was initiated, require Shift to stay held; otherwise cancel
            if (dragMode === 'erase' && !e.shiftKey) {
                isDragging = false;
                dragMode = null;
                canvas.style.cursor = 'default';
                if (this.currentGrid && this.currentStates) {
                    gridRenderer.render(this.currentGrid, this.currentStates);
                }
                return;
            }

            const mousePos = getMousePos(e);
            const cell = gridRenderer.getCellFromCanvasPosition(mousePos.x, mousePos.y);

            if (cell.valid) {
                const endCell = { row: cell.row, col: cell.col };
                drawPreview({ row: startY, col: startX }, endCell, dragMode || 'fill');
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            // If Ctrl not held on mouseup, treat as canceled drag
            if (!e.ctrlKey) {
                isDragging = false;
                dragMode = null;
                canvas.style.cursor = 'default';
                if (this.currentGrid && this.currentStates) {
                    gridRenderer.render(this.currentGrid, this.currentStates);
                }
                return;
            }
            // If erase mode, require Shift held at mouseup
            if (dragMode === 'erase' && !e.shiftKey) {
                isDragging = false;
                dragMode = null;
                canvas.style.cursor = 'default';
                if (this.currentGrid && this.currentStates) {
                    gridRenderer.render(this.currentGrid, this.currentStates);
                }
                return;
            }

            isDragging = false;
            const finalMode = dragMode || 'fill';
            dragMode = null;
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

                // Apply the rectangle with selected mode
                applyRectangle(minRow, minCol, maxRow, maxCol, finalMode);

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
                dragMode = null;
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

        if (data.neighborWeight !== undefined) {
            this.updateNeighborWeightDisplay(data.neighborWeight);
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
            neighborWeight: parseFloat(this.getElement(this.selectors.neighborWeightSlider)?.value || '2.0'),
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

    // Show temporary message (success or error)
    showMessage(message, type = 'info') {
        // Create or reuse toast container
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1';
        const borderColor = type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb';
        const textColor = type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460';

        toast.style.cssText = `
            background-color: ${bgColor};
            border: 1px solid ${borderColor};
            color: ${textColor};
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;

        // Add animation
        const style = document.createElement('style');
        if (!document.getElementById('toast-animation')) {
            style.id = 'toast-animation';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        toastContainer.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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