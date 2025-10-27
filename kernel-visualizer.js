/**
 * Kernel Visualizer Component
 * Reusable component for visualizing convolution kernels with contrastive colors
 */

export class KernelVisualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id '${containerId}' not found`);
    }

    this.cellSize = 60;
    this.padding = 3;
    this.debugMode = false;

    this.log("KernelVisualizer initialized");
  }

  /**
   * Visualize a single kernel with contrastive colors
   * @param {Array<Array<number>>} kernel - 2D array representing the kernel
   * @param {string} title - Title for the kernel visualization
   * @param {string} description - Optional description
   * @returns {HTMLElement} - The created visualization element
   */
  visualizeKernel(kernel, title, description = "") {
    const kernelWrapper = document.createElement("div");
    kernelWrapper.className =
      "kernel-visualization bg-white rounded-lg shadow-md p-4 mb-4";

    // Header with title and description
    const header = document.createElement("div");
    header.className = "mb-3";

    const titleElement = document.createElement("h3");
    titleElement.className = "text-sm font-semibold text-gray-800 mb-1";
    titleElement.textContent = title;
    header.appendChild(titleElement);

    if (description) {
      const descElement = document.createElement("p");
      descElement.className = "text-xs text-gray-600";
      descElement.textContent = description;
      header.appendChild(descElement);
    }

    // kernelWrapper.appendChild(header);

    // Kernel grid container
    const gridContainer = document.createElement("div");
    gridContainer.className = "flex justify-center items-center";

    // Create canvas for kernel visualization
    const canvas = document.createElement("canvas");
    const kernelHeight = kernel.length;
    const kernelWidth = kernel[0].length;

    canvas.width =
      kernelWidth * this.cellSize + (kernelWidth - 1) * this.padding;
    canvas.height =
      kernelHeight * this.cellSize + (kernelHeight - 1) * this.padding;
    canvas.className = "border border-gray-300 rounded";

    const ctx = canvas.getContext("2d");
    this.drawKernelOnCanvas(ctx, kernel);

    gridContainer.appendChild(canvas);
    kernelWrapper.appendChild(gridContainer);

    // Add kernel values display
    const valuesDisplay = this.createKernelValuesDisplay(kernel);
    kernelWrapper.appendChild(valuesDisplay);

    return kernelWrapper;
  }

  /**
   * Draw kernel on canvas with contrastive colors
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array<Array<number>>} kernel - 2D kernel array
   */
  drawKernelOnCanvas(ctx, kernel) {
    const kernelHeight = kernel.length;
    const kernelWidth = kernel[0].length;

    // Find min and max values for normalization
    let minValue = Infinity,
      maxValue = -Infinity;
    for (let row = 0; row < kernelHeight; row++) {
      for (let col = 0; col < kernelWidth; col++) {
        minValue = Math.min(minValue, kernel[row][col]);
        maxValue = Math.max(maxValue, kernel[row][col]);
      }
    }

    // Draw each cell
    for (let row = 0; row < kernelHeight; row++) {
      for (let col = 0; col < kernelWidth; col++) {
        const value = kernel[row][col];
        const x = col * (this.cellSize + this.padding);
        const y = row * (this.cellSize + this.padding);

        // Determine color based on value
        let color;
        if (value > 0) {
          // Positive values - blue scale
          const intensity =
            Math.abs(value) / Math.max(Math.abs(maxValue), 0.001);
          color = this.getPositiveColor(intensity);
        } else if (value < 0) {
          // Negative values - red scale
          const intensity =
            Math.abs(value) / Math.max(Math.abs(minValue), 0.001);
          color = this.getNegativeColor(intensity);
        } else {
          // Zero values - gray
          color = "#e5e7eb";
        }

        // Draw cell
        ctx.fillStyle = color;
        ctx.fillRect(x, y, this.cellSize, this.cellSize);

        // Draw border
        ctx.strokeStyle = "#374151";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, this.cellSize, this.cellSize);

        // Draw value text
        ctx.fillStyle = this.getContrastTextColor(color);
        ctx.font = "bold 12px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          value.toFixed(1),
          x + this.cellSize / 2,
          y + this.cellSize / 2,
        );
      }
    }
  }

  /**
   * Get color for positive values (blue scale)
   * @param {number} intensity - Normalized intensity (0-1)
   * @returns {string} - Hex color code
   */
  getPositiveColor(intensity) {
    // Blue gradient from light blue to dark blue
    const r = Math.floor(59 - intensity * 40);
    const g = Math.floor(130 - intensity * 70);
    const b = Math.floor(246 - intensity * 86);
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Get color for negative values (red scale)
   * @param {number} intensity - Normalized intensity (0-1)
   * @returns {string} - Hex color code
   */
  getNegativeColor(intensity) {
    // Red gradient from light red to dark red
    const r = Math.floor(252 - intensity * 80);
    const g = Math.floor(165 - intensity * 100);
    const b = Math.floor(165 - intensity * 100);
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Get contrasting text color for background
   * @param {string} backgroundColor - Background color
   * @returns {string} - Text color (white or black)
   */
  getContrastTextColor(backgroundColor) {
    // Simple luminance calculation
    const rgb = backgroundColor.match(/\d+/g);
    if (!rgb) return "#000000";

    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  }

  /**
   * Create a display showing kernel values in matrix format (click-expandable)
   * @param {Array<Array<number>>} kernel - 2D kernel array
   * @returns {HTMLElement} - Values display element
   */
  createKernelValuesDisplay(kernel) {
    const wrapper = document.createElement("div");
    wrapper.className = "mt-3 p-2 bg-gray-50 rounded text-xs cursor-pointer hover:bg-gray-100 transition-colors";
    wrapper.style.position = "relative";

    const title = document.createElement("div");
    title.className = "font-semibold text-gray-700 mb-1 flex items-center justify-between";
    title.innerHTML = `
      <span>Kernel Matrix:</span>
      <span class="expand-icon text-gray-400 text-xs">▶</span>
    `;
    wrapper.appendChild(title);

    // Collapsible content
    const content = document.createElement("div");
    content.className = "kernel-matrix-content overflow-hidden transition-all duration-300 max-h-0";

    const pre = document.createElement("pre");
    pre.className = "mono text-gray-600 whitespace-pre text-xs";

    // Format kernel as matrix string
    const matrixString = kernel
      .map(
        (row) =>
          "[" +
          row
            .map((val) =>
              val >= 0 ? val.toFixed(1).padStart(5) : val.toFixed(1),
            )
            .join(", ") +
          "]",
      )
      .join(",\n ");

    pre.textContent = "[\n " + matrixString + "\n]";
    content.appendChild(pre);
    wrapper.appendChild(content);

    // Click handler for expansion
    wrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleMatrixExpansion(wrapper, content);
    });

    return wrapper;
  }

  /**
   * Toggle expansion of kernel matrix display
   * @param {HTMLElement} wrapper - The wrapper element
   * @param {HTMLElement} content - The content element to expand/collapse
   */
  toggleMatrixExpansion(wrapper, content) {
    const isExpanded = content.classList.contains("expanded");
    const expandIcon = wrapper.querySelector(".expand-icon");

    if (isExpanded) {
      // Collapse
      content.classList.remove("expanded");
      content.style.maxHeight = "0";
      expandIcon.textContent = "▶";
      wrapper.classList.remove("expanded");
    } else {
      // Expand
      content.classList.add("expanded");
      content.style.maxHeight = content.scrollHeight + "px";
      expandIcon.textContent = "▼";
      wrapper.classList.add("expanded");

      // Smooth scroll to view the expanded content
      setTimeout(() => {
        wrapper.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }

  /**
   * Parse kernel from text input
   * @param {string} kernelText - Text representation of kernel
   * @returns {Array<Array<number>>|null} - Parsed kernel or null if invalid
   */
  parseKernelFromText(kernelText) {
    try {
      // Remove whitespace and parse as JavaScript array
      const cleanText = kernelText.trim();
      if (!cleanText.startsWith("[") || !cleanText.endsWith("]")) {
        return null;
      }

      // Use Function constructor for safe parsing
      const kernel = new Function("return " + cleanText)();

      // Validate kernel structure
      if (!Array.isArray(kernel) || kernel.length === 0) {
        return null;
      }

      // Ensure all rows are arrays of numbers
      const firstRowLength = kernel[0].length;
      for (const row of kernel) {
        if (!Array.isArray(row) || row.length !== firstRowLength) {
          return null;
        }
        for (const val of row) {
          if (typeof val !== "number" || !isFinite(val)) {
            return null;
          }
        }
      }

      return kernel;
    } catch (error) {
      this.log("Error parsing kernel:", error);
      return null;
    }
  }

  /**
   * Clear the container
   */
  clear() {
    if (this.container) {
      this.container.innerHTML = "";
    }
  }

  /**
   * Add legend for color interpretation
   * @returns {HTMLElement} - Legend element
   */
  createLegend() {
    const legend = document.createElement("div");
    legend.className = "kernel-legend bg-gray-50 rounded-lg p-4 mb-4";

    const title = document.createElement("h3");
    title.className = "text-sm font-semibold text-gray-800 mb-2";
    title.textContent = "Color Legend";
    legend.appendChild(title);

    const legendItems = [
      { color: this.getPositiveColor(1), label: "Positive Values" },
      { color: this.getNegativeColor(1), label: "Negative Values" },
      { color: "#e5e7eb", label: "Zero" },
    ];

    const legendGrid = document.createElement("div");
    legendGrid.className = "flex space-x-4";

    legendItems.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "flex items-center space-x-2";

      const colorBox = document.createElement("div");
      colorBox.className = "w-4 h-4 border border-gray-400 rounded";
      colorBox.style.backgroundColor = item.color;

      const label = document.createElement("span");
      label.className = "text-xs text-gray-600";
      label.textContent = item.label;

      itemDiv.appendChild(colorBox);
      itemDiv.appendChild(label);
      legendGrid.appendChild(itemDiv);
    });

    legend.appendChild(legendGrid);
    return legend;
  }

  /**
   * Show error message
   * @param {string} message - Error message
   * @returns {HTMLElement} - Error element
   */
  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className =
      "bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm";
    errorDiv.textContent = message;
    return errorDiv;
  }

  /**
   * Logging function
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (this.debugMode) {
      console.log("[KernelVisualizer]", ...args);
    }
  }
}
