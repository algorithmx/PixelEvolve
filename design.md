# Grid Evolution Webapp - Design Style

## Design Philosophy

### Visual Language
- **Scientific Precision**: Clean, minimal interface that emphasizes data visualization
- **Interactive Clarity**: Clear visual hierarchy with intuitive control layouts
- **Modern Aesthetic**: Contemporary web design with subtle animations and smooth transitions

### Color Palette
- **Primary Blue**: #2563eb (occupied cells, active states)
- **Background**: #f8fafc (light gray canvas)
- **Grid Lines**: #e2e8f0 (subtle gray)
- **Text**: #1e293b (dark gray for readability)
- **Accent**: #06b6d4 (cyan for highlights and controls)
- **Success**: #10b981 (green for completed states)

### Typography
- **Display Font**: Inter (clean, modern sans-serif)
- **Monospace**: JetBrains Mono (for data displays and counters)
- **Hierarchy**: Large headings, medium labels, small body text

## Visual Effects

### Used Libraries
- **Anime.js**: Smooth cell state transitions and grid animations
- **Canvas API**: High-performance grid rendering and diagonal cell drawing
- **ECharts.js**: Cost function visualization and convergence plots

### Animation Effects
- **Cell Transitions**: Smooth morphing between 6 states with color interpolation
- **Grid Updates**: Ripple effects when cells change during evolution
- **Control Feedback**: Subtle hover animations on buttons and sliders
- **Cost Visualization**: Real-time line chart showing optimization progress

### Styling Approach
- **Grid Cells**: Canvas-rendered with precise diagonal divisions using clipping paths
- **Diagonal States**: Clean geometric splits with anti-aliased edges
- **Hover States**: Subtle glow effects on interactive elements
- **Loading States**: Elegant progress indicators during computation

### Header Effect
- **Minimal Navigation**: Clean top bar with app title and settings access
- **Status Bar**: Compact information display showing current evolution state
- **Responsive Layout**: Adapts gracefully to different screen sizes

### Layout Structure
- **Central Grid**: Large, prominent visualization area
- **Control Sidebar**: Organized parameter controls on the right
- **Status Footer**: Evolution metrics and termination information
- **Responsive Grid**: Maintains aspect ratio across devices