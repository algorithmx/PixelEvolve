// UI Controller - UI updates and event handling

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
            stepBtn: '#step-btn',
            resetBtn: '#reset-btn',
            randomBtn: '#random-btn',
            gridCanvas: '#grid-canvas',
            gridSizeSelect: '#grid-size-select',
            speedSlider: '#speed-slider',
            speedValue: '#speed-value',
            evolutionMethodRadios: 'input[name="evolution-method"]',
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
            patternWeightSlider: '#pattern-weight',
            patternWeightValue: '#pattern-weight-value',
            zebraWeightSlider: '#zebra-weight',
            zebraWeightValue: '#zebra-weight-value',
            presetSelect: '#preset-select',
            maxStepsSlider: '#max-steps',
            maxStepsValue: '#max-steps-value'
        };

        this.log('UI Controller initialized');
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

    // Update button states based on evolution status
    updateButtonStates(isRunning) {
        const startBtn = this.getElement(this.selectors.startBtn);
        const pauseBtn = this.getElement(this.selectors.pauseBtn);
        const stepBtn = this.getElement(this.selectors.stepBtn);

        if (isRunning) {
            // Running state
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.classList.add('opacity-50');
            }
            if (pauseBtn) {
                pauseBtn.disabled = false;
                pauseBtn.classList.remove('opacity-50');
            }
            if (stepBtn) {
                stepBtn.disabled = true;
                stepBtn.classList.add('opacity-50');
            }
        } else {
            // Stopped state
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.classList.remove('opacity-50');
            }
            if (pauseBtn) {
                pauseBtn.disabled = true;
                pauseBtn.classList.add('opacity-50');
            }
            if (stepBtn) {
                stepBtn.disabled = false;
                stepBtn.classList.remove('opacity-50');
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
        const element = this.getElement(this.selectors.temperatureValue);
        if (element) {
            element.textContent = temperature.toFixed(3);
        }
    }

    // Update cooling rate display
    updateCoolingRateDisplay(coolingRate) {
        const element = this.getElement(this.selectors.coolingRateValue);
        if (element) {
            element.textContent = coolingRate.toFixed(3);
        }
    }

    // Update weight displays
    updateWeightDisplays(weights) {
        if (weights.edgeSharpness !== undefined) {
            const element = this.getElement(this.selectors.edgeWeightValue);
            if (element) {
                element.textContent = weights.edgeSharpness.toFixed(1);
            }
        }

        if (weights.cornerPenalty !== undefined) {
            const element = this.getElement(this.selectors.cornerWeightValue);
            if (element) {
                element.textContent = weights.cornerPenalty.toFixed(1);
            }
        }

        if (weights.patternPenalty !== undefined) {
            const element = this.getElement(this.selectors.patternWeightValue);
            if (element) {
                element.textContent = weights.patternPenalty.toFixed(1);
            }
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

        // Evolution method
        const evolutionRadios = this.getElements(this.selectors.evolutionMethodRadios);
        evolutionRadios.forEach(radio => {
            if (handlers.onEvolutionMethodChange) {
                radio.addEventListener('change', (e) => {
                    const useAnnealing = e.target.value === 'annealing';
                    handlers.onEvolutionMethodChange(useAnnealing);
                });
            }
        });

        // Temperature control
        const temperatureSlider = this.getElement(this.selectors.temperatureSlider);
        if (temperatureSlider && handlers.onTemperatureChange) {
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

        // Cost weights
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

        const patternWeightSlider = this.getElement(this.selectors.patternWeightSlider);
        if (patternWeightSlider && handlers.onPatternWeightChange) {
            patternWeightSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                handlers.onPatternWeightChange(value);
            });
        }

        const zebraWeightSlider = this.getElement(this.selectors.zebraWeightSlider);
        if (zebraWeightSlider && handlers.onZebraWeightChange) {
            zebraWeightSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                handlers.onZebraWeightChange(value);
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

        if (data.weights !== undefined) {
            this.updateWeightDisplays(data.weights);
        }

        if (data.showAnnealingControls !== undefined) {
            this.toggleAnnealingControls(data.showAnnealingControls);
        }
    }

    // Get current values from UI controls
    getUIValues() {
        return {
            gridSize: parseInt(this.getElement(this.selectors.gridSizeSelect)?.value || '32'),
            evolutionSpeed: parseInt(this.getElement(this.selectors.speedSlider)?.value || '2'),
            evolutionMethod: this.getElements(this.selectors.evolutionMethodRadios)?.forEach(radio => {
                if (radio.checked) return radio.value;
            }) || 'annealing',
            temperature: parseFloat(this.getElement(this.selectors.temperatureSlider)?.value || '1.0'),
            coolingRate: parseFloat(this.getElement(this.selectors.coolingRateSlider)?.value || '0.995'),
            areaPreservation: this.getElement(this.selectors.areaPreservationCheckbox)?.checked !== false,
            edgeWeight: parseFloat(this.getElement(this.selectors.edgeWeightSlider)?.value || '1.0'),
            cornerWeight: parseFloat(this.getElement(this.selectors.cornerWeightSlider)?.value || '0.5'),
            patternWeight: parseFloat(this.getElement(this.selectors.patternWeightSlider)?.value || '2.0'),
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