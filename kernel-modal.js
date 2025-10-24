/**
 * Kernel Modal Manager
 * Handles the modal for visualizing convolution kernels and experimenting with custom kernels
 */

import { KernelVisualizer } from './kernel-visualizer.js';
import { ZebraKernels } from './zebra-kernels.js';
import { GeometricKernels } from './geometric-kernels.js';

export class KernelModal {
    constructor() {
        this.modal = null;
        this.visualizer = null;
        this.customVisualizer = null; // Separate visualizer for custom kernels
        this.isOpen = false;
        this.zebraKernels = null;
        this.geometricKernels = null;

        this.initializeModal();
        this.bindEvents();
    }

    /**
     * Initialize modal structure
     */
    initializeModal() {
        // Create modal HTML structure
        const modalHTML = `
            <div id="kernel-modal" class="fixed inset-0 z-50 hidden">
                <!-- Backdrop -->
                <div class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

                <!-- Modal Content -->
                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-start justify-center pt-2 pb-2 px-2">
                        <div class="modal-content relative bg-white rounded-xl shadow-2xl w-full max-h-[98vh] overflow-hidden">

                            <!-- Header -->
                            <div class="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 border-b border-gray-200">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <h2 class="text-xl font-bold">Convolution Kernel Visualizer</h2>
                                        <p class="text-sm opacity-90">Explore zebra pattern detection kernels</p>
                                    </div>
                                    <button id="close-modal" class="text-white hover:text-gray-200 transition-colors">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <!-- Body -->
                            <div class="modal-body p-4 overflow-y-auto" style="max-height: calc(98vh - 80px);">

                                <!-- Tab Navigation -->
                                <div class="flex space-x-1 mb-4 border-b border-gray-200">
                                    <button class="tab-btn px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600" data-tab="existing">
                                        Existing Kernels
                                    </button>
                                    <button class="tab-btn px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800" data-tab="experiment">
                                        Experiment
                                    </button>
                                </div>

                                <!-- Existing Kernels Tab -->
                                <div id="existing-kernels-tab" class="tab-content">
                                    <div class="mb-3">
                                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <h3 class="text-sm font-semibold text-blue-800 mb-1">About Zebra Pattern Detection</h3>
                                            <p class="text-sm text-blue-700 leading-tight">
                                                These convolution kernels detect undesirable alternating patterns (zebra patterns) in the grid.
                                                Positive weights (blue) reinforce patterns, while negative weights (red) detect alternations.
                                            </p>
                                        </div>
                                    </div>

                                    <!-- Legend -->
                                    <div id="kernel-legend-container"></div>

                                    <!-- Kernels Grid -->
                                    <div id="kernels-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        <!-- Kernels will be populated here -->
                                    </div>
                                </div>

                                <!-- Experiment Tab -->
                                <div id="experiment-tab" class="tab-content hidden">
                                    <div class="space-y-4">
                                        <!-- Input Section -->
                                        <div class="bg-gray-50 rounded-lg p-4">
                                            <h3 class="text-lg font-semibold text-gray-800 mb-3">Design Your Own Kernel</h3>

                                            <div class="space-y-3">
                                                <div>
                                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                                        Kernel Matrix (JavaScript array format)
                                                    </label>
                                                    <textarea
                                                        id="kernel-input"
                                                        class="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Example:
[[ 1, -1,  1],
 [ 0,  2,  0],
 [-1,  1, -1]]">[[ 1, -1,  1],
 [ 0,  2,  0],
 [-1,  1, -1]]</textarea>
                                                </div>

                                                <div class="flex space-x-3">
                                                    <button id="visualize-custom" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                                        Visualize Kernel
                                                    </button>
                                                    <button id="clear-custom" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Custom Kernel Visualization -->
                                        <div id="custom-kernel-result" class="hidden">
                                            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <h4 class="text-sm font-semibold text-green-800 mb-2">Your Kernel Visualization</h4>
                                                <div id="custom-kernel-container"></div>
                                            </div>
                                        </div>

                                        <!-- Error Display -->
                                        <div id="kernel-error" class="hidden">
                                            <!-- Error messages will appear here -->
                                        </div>

                                        <!-- Templates Section -->
                                        <div class="bg-yellow-50 rounded-lg p-4">
                                            <h3 class="text-lg font-semibold text-gray-800 mb-3">Kernel Templates</h3>
                                            <p class="text-sm text-gray-600 mb-3">Click on a template to load it for editing:</p>

                                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                <div class="template-card bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-300 transition-colors" data-template="edge-detection">
                                                    <h4 class="font-semibold text-gray-800 mb-1 text-sm">Edge Detection</h4>
                                                    <p class="text-xs text-gray-600 mb-2">Basic edge detection kernel</p>
                                                    <code class="text-xs bg-gray-100 p-1 rounded block font-mono">[[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]]</code>
                                                </div>

                                                <div class="template-card bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-300 transition-colors" data-template="sharpen">
                                                    <h4 class="font-semibold text-gray-800 mb-1 text-sm">Sharpen</h4>
                                                    <p class="text-xs text-gray-600 mb-2">Image sharpening kernel</p>
                                                    <code class="text-xs bg-gray-100 p-1 rounded block font-mono">[[0, -1, 0], [-1, 5, -1], [0, -1, 0]]</code>
                                                </div>

                                                <div class="template-card bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-300 transition-colors" data-template="blur">
                                                    <h4 class="font-semibold text-gray-800 mb-1 text-sm">Blur</h4>
                                                    <p class="text-xs text-gray-600 mb-2">Gaussian blur approximation</p>
                                                    <code class="text-xs bg-gray-100 p-1 rounded block font-mono">[[1, 2, 1], [2, 4, 2], [1, 2, 1]]</code>
                                                </div>

                                                <div class="template-card bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-300 transition-colors" data-template="diagonal">
                                                    <h4 class="font-semibold text-gray-800 mb-1 text-sm">Diagonal Detection</h4>
                                                    <p class="text-xs text-gray-600 mb-2">Detect diagonal patterns</p>
                                                    <code class="text-xs bg-gray-100 p-1 rounded block font-mono">[[2, -1, -1], [-1, 0, -1], [-1, -1, 2]]</code>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('kernel-modal');
    }

    /**
     * Bind event handlers
     */
    bindEvents() {
        // Close modal
        const closeBtn = document.getElementById('close-modal');
        const backdrop = this.modal.querySelector('.modal-backdrop');

        [closeBtn, backdrop].forEach(element => {
            element.addEventListener('click', () => this.close());
        });

        // Tab switching
        const tabBtns = this.modal.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Custom kernel visualization
        document.getElementById('visualize-custom').addEventListener('click', () => {
            this.visualizeCustomKernel();
        });

        document.getElementById('clear-custom').addEventListener('click', () => {
            this.clearCustomKernel();
        });

        // Template selection
        const templateCards = this.modal.querySelectorAll('.template-card');
        templateCards.forEach(card => {
            card.addEventListener('click', () => {
                this.loadTemplate(card.dataset.template);
            });
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    /**
     * Open the modal
     */
    open() {
        if (!this.modal) return;

        this.modal.classList.remove('hidden');
        this.isOpen = true;

        // Initialize visualizer and load kernels
        setTimeout(() => {
            this.initializeVisualizer();
            this.loadExistingKernels();
        }, 100);

        // Add body scroll lock
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close the modal
     */
    close() {
        if (!this.modal) return;

        this.modal.classList.add('hidden');
        this.isOpen = false;

        // Remove body scroll lock
        document.body.style.overflow = '';

        // Clean up visualizers
        if (this.visualizer) {
            this.visualizer.clear();
            this.visualizer = null;
        }
        if (this.customVisualizer) {
            this.customVisualizer.clear();
            this.customVisualizer = null;
        }
    }

    /**
     * Initialize the kernel visualizer
     */
    initializeVisualizer() {
        this.visualizer = new KernelVisualizer('kernels-container');
        this.visualizer.debugMode = false;

        // Create separate visualizer for custom kernels (with dummy container)
        this.customVisualizer = new KernelVisualizer('custom-kernel-container');
        this.customVisualizer.debugMode = false;

        // Initialize all kernel systems
        this.zebraKernels = new ZebraKernels(32); // Default size
        this.geometricKernels = new GeometricKernels(32); // Default size
    }

    /**
     * Load and display all existing kernels
     */
    loadExistingKernels() {
        if (!this.visualizer || !this.zebraKernels || !this.geometricKernels) return;

        const container = document.getElementById('kernels-container');
        const legendContainer = document.getElementById('kernel-legend-container');

        // Check if content already exists - only initialize if container is empty
        if (container.children.length > 0) {
            // Content already loaded, no need to regenerate
            return;
        }

        // Clear existing content
        container.innerHTML = '';
        legendContainer.innerHTML = '';

        // Add legend
        const legend = this.visualizer.createLegend();
        legendContainer.appendChild(legend);

        // 1. Load Zebra Pattern Kernels
        this.addKernelSection('Zebra Pattern Detection Kernels', this.zebraKernels.kernels);

        // 2. Load Geometric Kernels (organized by category)
        const allGeometricKernels = this.geometricKernels.getAllKernels();

        this.addKernelSection('Corner Detection Kernels', allGeometricKernels.corners);
        this.addKernelSection('Continuity Detection Kernels', allGeometricKernels.continuity);
        this.addKernelSection('Directional Flow Kernels', allGeometricKernels.flow);
    }

    /**
     * Add a section of kernels to the display
     * @param {string} title - Section title
     * @param {Object} kernels - Kernels object
     */
    addKernelSection(title, kernels) {
        const container = document.getElementById('kernels-container');

        // Create section header
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 mb-3';

        const headerTitle = document.createElement('h3');
        headerTitle.className = 'text-lg font-semibold text-gray-800 border-b border-gray-300 pb-1';
        headerTitle.textContent = title;

        sectionHeader.appendChild(headerTitle);
        container.appendChild(sectionHeader);

        // Visualize each kernel in this section
        Object.entries(kernels).forEach(([name, kernelInfo]) => {
            const visualization = this.visualizer.visualizeKernel(
                kernelInfo.kernel,
                this.formatKernelName(name),
                kernelInfo.description
            );
            container.appendChild(visualization);
        });
    }

    /**
     * Format kernel name for display
     * @param {string} name - Internal kernel name
     * @returns {string} - Formatted display name
     */
    formatKernelName(name) {
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Switch between tabs
     * @param {string} tabName - Tab to switch to
     */
    switchTab(tabName) {
        // Re-initialize visualizer first if switching to existing tab
        if (tabName === 'existing' && !this.visualizer) {
            this.visualizer = new KernelVisualizer('kernels-container');
            this.visualizer.debugMode = false;
        }

        // Update tab buttons
        const tabBtns = this.modal.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.className = 'tab-btn px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600';
            } else {
                btn.className = 'tab-btn px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800';
            }
        });

        // Hide all tab contents first
        const existingTab = document.getElementById('existing-kernels-tab');
        const experimentTab = document.getElementById('experiment-tab');

        if (existingTab) {
            existingTab.classList.add('hidden');
        }
        if (experimentTab) {
            experimentTab.classList.add('hidden');
        }

        // Show the active tab
        const activeTabId = tabName === 'existing' ? 'existing-kernels-tab' : 'experiment-tab';
        const activeTab = document.getElementById(activeTabId);
        if (activeTab) {
            activeTab.classList.remove('hidden');
            console.log(`[KernelModal] Showing tab: ${tabName} (${activeTabId}), hidden classes:`, {
                existingTabHidden: existingTab ? existingTab.classList.contains('hidden') : 'N/A',
                experimentTabHidden: experimentTab ? experimentTab.classList.contains('hidden') : 'N/A'
            });
        } else {
            console.error(`[KernelModal] Tab not found: ${activeTabId}`);
        }

        // Load content for the specific tab
        if (tabName === 'existing') {
            // Load kernels after making the tab visible, but only if not already loaded
            setTimeout(() => {
                this.loadExistingKernels();
            }, 10);
        }
    }

    /**
     * Visualize custom kernel from input
     */
    visualizeCustomKernel() {
        const input = document.getElementById('kernel-input').value;
        const resultContainer = document.getElementById('custom-kernel-result');
        const errorContainer = document.getElementById('kernel-error');
        const kernelContainer = document.getElementById('custom-kernel-container');

        // Clear previous results
        resultContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        kernelContainer.innerHTML = '';

        // Parse kernel
        const kernel = this.customVisualizer.parseKernelFromText(input);
        if (!kernel) {
            errorContainer.innerHTML = '';
            const error = this.customVisualizer.showError('Invalid kernel format. Please enter a valid 2D array.');
            errorContainer.appendChild(error);
            errorContainer.classList.remove('hidden');
            return;
        }

        // Use custom visualizer to create custom kernel visualization
        const visualization = this.customVisualizer.visualizeKernel(
            kernel,
            'Your Custom Kernel',
            'This is how your kernel will be visualized'
        );

        // Append the visualization to the custom kernel container
        kernelContainer.appendChild(visualization);
        resultContainer.classList.remove('hidden');

        // Animate the appearance
        anime({
            targets: resultContainer,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 500,
            easing: 'easeOutQuad'
        });
    }

    /**
     * Clear custom kernel input and results
     */
    clearCustomKernel() {
        document.getElementById('kernel-input').value = '';
        document.getElementById('custom-kernel-result').classList.add('hidden');
        document.getElementById('kernel-error').classList.add('hidden');
        document.getElementById('custom-kernel-container').innerHTML = '';
    }

    /**
     * Load a template kernel
     * @param {string} templateName - Name of template to load
     */
    loadTemplate(templateName) {
        const templates = {
            'edge-detection': '[[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]]',
            'sharpen': '[[0, -1, 0], [-1, 5, -1], [0, -1, 0]]',
            'blur': '[[1, 2, 1], [2, 4, 2], [1, 2, 1]]',
            'diagonal': '[[2, -1, -1], [-1, 0, -1], [-1, -1, 2]]'
        };

        const kernelText = templates[templateName];
        if (kernelText) {
            document.getElementById('kernel-input').value = kernelText;

            // Switch to experiment tab
            this.switchTab('experiment');

            // Visualize the template
            setTimeout(() => {
                this.visualizeCustomKernel();
            }, 100);
        }
    }
}