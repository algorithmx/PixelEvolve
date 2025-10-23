# Grid Evolution Webapp - Interaction Design

## Core Interaction Components

### 1. Grid Visualization Area
- **32x32 interactive grid** (configurable size)
- **6-state cells**: Empty (white), Full (blue), 4 diagonal half-occupied states (blue/white diagonal splits)
- **Click to manually toggle** cell states for initial configuration
- **Real-time visual updates** during evolution

### 2. Evolution Control Panel
- **Start/Pause Evolution Button**: Toggle automatic evolution
- **Reset Button**: Clear grid to empty state and reset evolution
- **Step Button**: Manual single evolution step for debugging

### 3. Configuration Controls
- **Grid Size Input**: Number input for N x N grid size (default 32)
- **Evolution Speed Slider**: Control animation speed from slow to fast
- **Area Preservation Toggle**: Enable/disable area conservation
- **Cost Function Weights**: Sliders for adjusting penalty strengths
  - Edge sharpness penalty
  - Corner penalty  
  - Pattern penalty (checkerboard/zebra)

### 4. Status Display
- **Current Step Counter**: Show evolution iteration number
- **Current Cost Value**: Display real-time cost function value
- **Termination Status**: Show why evolution stopped (convergence, max steps, etc.)

### 5. Preset Configurations
- **Dropdown Menu**: Quick selection of predefined scenarios
  - "Smooth Blob": Single large cluster
  - "Checkerboard Test": Pattern penalty demonstration
  - "Random Scatter": Uniform distribution
  - "Custom": User-defined initial state

## User Interaction Flow

1. **Initial Setup**: User selects grid size and initial configuration
2. **Manual Configuration**: Click cells to set desired initial pattern
3. **Parameter Tuning**: Adjust cost function weights and evolution speed
4. **Evolution Start**: Press start to begin automated optimization
5. **Monitoring**: Watch cost value decrease and pattern evolve
6. **Intervention**: Pause, reset, or modify parameters during evolution
7. **Completion**: Evolution stops when cost converges or max steps reached

## Technical Implementation Notes

- Grid state stored as 2D array with values 0-5 representing 6 states
- Canvas-based rendering for smooth animations
- Web Workers for heavy computation to maintain UI responsiveness
- Local storage to save user configurations