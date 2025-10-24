# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PixelEvolve is an interactive grid evolution simulator that visualizes cellular automaton optimization. The application uses a 6-state cellular system where cells can be empty, full, or have diagonal half-occupancy states. The system evolves according to a cost function that favors smooth, blob-like patterns while penalizing sharp corners, checkerboard patterns, and zebra patterns.

## Architecture

### Core Components

**HTML Structure (`index.html`)**
- Single-page web application with responsive layout
- Uses Tailwind CSS for styling and CDNs for external libraries
- Main components: grid canvas, control panel, cost chart visualization

**Grid Evolution Engine (`robust-grid.js`)**
- `GridEvolution` class: Core simulation logic
- 6-state cellular system: EMPTY(0), FULL(1), and 4 diagonal half-states (2-5)
- Cost function optimization with configurable weights
- Canvas-based rendering for smooth animations
- Robust initialization with multiple fallback strategies

**External Dependencies**
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Anime.js**: Smooth animations for transitions (loaded via CDN)
- **ECharts.js**: Cost function visualization charts (loaded via CDN)
- **Inter & JetBrains Mono fonts**: Typography for UI and monospace displays

### State System

The grid uses a 6-state system:
- `STATE.EMPTY (0)`: White, no occupancy
- `STATE.FULL (1)`: Blue, fully occupied
- `STATE.HALF_DIAG_TL_BR (2)`: Diagonal from top-left to bottom-right
- `STATE.HALF_DIAG_TR_BL (3)`: Diagonal from top-right to bottom-left
- `STATE.HALF_DIAG_BL_TR (4)`: Diagonal from bottom-left to top-right
- `STATE.HALF_DIAG_BR_TL (5)`: Diagonal from bottom-right to top-left

### Cost Function

The optimization uses three weighted components:
- **Edge Sharpness Penalty**: Favors smooth transitions between cells
- **Corner Penalty**: Penalizes sharp geometric corners
- **Pattern Penalty**: Detects and penalizes checkerboard/zebra patterns

Area preservation maintains approximately 30% grid occupancy.

## Development Workflow

### Running the Application
This is a client-side only application. Simply open `index.html` in a web browser:
```bash
# If you have a local server:
python -m http.server 8000
# Then open http://localhost:8000

# Or directly open the file:
open index.html
```

### No Build Process
The project uses vanilla JavaScript with external CDNs - no build tools, package.json, or compilation steps are required.

### Testing
No automated test suite exists. Manual testing is done by:
1. Opening the application in different browsers
2. Testing all UI controls and interactions
3. Verifying canvas rendering and cost visualization
4. Checking error handling and edge cases

### Code Style
- JavaScript ES6+ features used throughout
- Comprehensive error handling with try-catch blocks
- Extensive console logging for debugging (controlled by `debugMode` flag)
- Modular class-based architecture in `robust-grid.js`

## Key Implementation Details

### Canvas Rendering
- Direct Canvas API usage for high-performance grid visualization
- Diagonal states rendered using clipping paths and triangular fills
- Grid lines drawn as separate overlay
- Responsive canvas sizing based on grid dimensions

### Evolution Algorithm
1. Find all candidate state changes that would improve cost
2. Sort by cost improvement (most negative first)
3. Apply best change that respects area preservation
4. Update UI and re-render
5. Check termination conditions (max steps, convergence, threshold)

### Robust Initialization
Multiple fallback strategies ensure the application works across different browsers and loading scenarios:
1. Direct initialization attempt
2. DOM-ready fallback
3. Retry with increasing delays
4. Comprehensive error messages

### Interactive Features
- Click cells to manually toggle states
- Real-time parameter adjustment via sliders
- Preset configurations for quick testing
- Live cost visualization with ECharts
- Pause/resume evolution control

## File Structure

```
PixelEvolve/
├── index.html          # Main application HTML
├── robust-grid.js      # Core GridEvolution class and logic
├── design.md          # Design philosophy and visual guidelines
├── interaction.md     # User interaction specifications
└── CLAUDE.md          # This file - development guidance
```

## Common Development Tasks

### Adding New Cost Function Components
1. Add weight parameter to `costWeights` object in constructor
2. Implement cost calculation in `getCellCost()` method
3. Add UI controls (slider) in index.html
4. Bind controls in `bindControls()` function

### Modifying State System
1. Update `STATES` static object in `robust-grid.js`
2. Modify `renderCell()` to handle new states
3. Update `getAreaContribution()` if area changes
4. Adjust `toggleCell()` to cycle through new states

### Adding New Preset Patterns
1. Add case to `applyPreset()` function in index.html
2. Implement grid initialization logic
3. Add option to preset dropdown in HTML

### UI Customization
- Styles: Modify Tailwind classes in index.html or add custom CSS
- Layout: Adjust grid structure in the HTML grid system
- Colors: Update color constants in design.md and implement in JavaScript

## Debugging

The application includes comprehensive logging controlled by the `debugMode` flag in the GridEvolution class. All major operations are logged to the browser console with `[GridEvolution]` prefix. Error conditions trigger `console.error` calls with descriptive messages.

Common debugging steps:
1. Open browser developer tools
2. Check console for initialization errors
3. Verify canvas element exists and has correct dimensions
4. Monitor cost values during evolution
5. Test UI controls individually