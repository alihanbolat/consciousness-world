# Consciousness World 🧠

A sophisticated artificial consciousness simulation featuring neural networks, evolution, and emergent behavior. This project explores artificial life through conscious entities that perceive their environment through raw sensory fields, learn through experience, and evolve over generations.

## ✨ Features

### 🧬 Conscious Entities
- **Neural Network Brains**: Multi-layer feedforward networks with 542 inputs and sophisticated decision-making
- **Raw Sensory Perception**: Entities perceive 5 distinct physical fields through a 9x9 vision grid
- **Experience Memory**: Temporal memory system with 50-experience capacity for learning from past interactions
- **REINFORCE Learning**: Real-time learning from rewards and punishments

### 🌍 Complex World Physics
- **Two-Dimensional Reality**: Lower and upper dimensional layers with intricate interactions
- **Dynamic Temperature Waves**: Shifting thermal landscapes that drive world dynamics
- **Catalyser Systems**: Chemical-like fields that enable core incubation and energy manifestation
- **Energy Bloom Cycles**: Cores transition through dormant → incubated → bloomed states

### 🧬 Evolution & Genetics
- **Population-Based Evolution**: Fixed population of 5 entities with fitness-based selection
- **Genetic Algorithms**: Neural network mutation with configurable rates and strengths
- **Survival of the Fittest**: Natural selection based on age and energy acquisition
- **Generational Tracking**: Detailed evolution statistics and trends

### 🎨 Advanced Visualization
- **Multi-Layer Rendering**: Temperature fields, catalyser distributions, cores, energies, and entities
- **Real-Time Analysis**: Live entity statistics, memory inspection, and neural network monitoring
- **Interactive Controls**: Entity selection, speed control, visualization toggles
- **Data Export**: Comprehensive simulation data and state export capabilities

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- Modern web browser with ES6 module support

### Installation

1. **Clone or extract the project**:
   ```bash
   cd consciousness-world
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

### Alternative: Direct File Access
If you prefer not to use a server, you can open `public/index.html` directly in a modern browser that supports ES6 modules (Chrome, Firefox, Safari).

## 🎮 Usage Guide

### Basic Controls
- **Start/Stop**: Click the "Start Simulation" button or press `S`
- **Single Step**: Use "Single Step" button or press `Space` (when paused)
- **Reset**: Click "Reset World" or press `R`
- **Speed Control**: Adjust the speed slider (1-20 ticks/second)

### Entity Observation
- **Select Entity**: Click on an entity or use the dropdown selector
- **View Details**: Selected entity shows detailed sensory data, memory, and neural network info
- **Vision Visualization**: Selected entities show their perception cone and field strengths

### Keyboard Shortcuts
- `Space` - Single step (when paused)
- `R` - Reset simulation
- `S` - Start/stop simulation
- `E` - Export data
- `P` - Force evolution event
- `D` - Toggle data recording
- `Esc` - Deselect entity

### Visualization Options
Toggle different visual layers:
- **Temperature**: Thermal field overlay (orange)
- **Catalyser**: Chemical field overlay (blue)
- **Cores**: Core states (dark gray = dormant, gray = incubated, light gray = bloomed)
- **Energy**: Energy manifestations (bright green)
- **Entities**: Conscious entities (red to yellow spectrum)
- **Entity Paths**: Movement trails

## 📊 Understanding the Simulation

### The World Physics

#### Lower Dimension
- **Temperature Field**: Dynamic thermal waves that shift rightward with diffusion
- **Catalyser Field**: Enables core incubation when concentration > 0.2
- **Cores**: 50 cores that cycle through states based on catalyser and temperature exposure
- **Energy Manifestations**: Created when cores bloom, provide sustenance for entities

#### Upper Dimension
- **Catalyser Density**: Controls redistribution of lower dimension catalyser during collect phases

### Conscious Entities

#### Sensory System
Entities perceive their world through 5 raw physical fields:
1. **Field 1 (Thermal Flux)**: Temperature and catalyser interactions with temporal variation
2. **Field 2 (Matter Resonance)**: Core states combined with thermal-catalyser products
3. **Field 3 (Energy Potential)**: Energy detection with spatial variation
4. **Field 4 (Spatial Gradient)**: Spatial context with neighbor influences
5. **Field 5 (Life Force)**: Detects other conscious entities nearby

#### Neural Architecture
- **Input Layer**: 542 neurons
  - 405 vision neurons (81 positions × 5 fields)
  - 81 confidence values
  - 6 internal state neurons
  - 50 memory summary neurons
- **Hidden Layers**: [256, 128, 64] neurons with ReLU activation
- **Output Layer**: 5 neurons (up, down, left, right, stay) with softmax activation

#### Learning Systems
- **Experience Memory**: Records observations with outcomes (energy_gained, energy_lost, moved)
- **REINFORCE Learning**: Adjusts neural weights based on recent reward outcomes
- **Temporal Awareness**: Cyclical time encoding for pattern recognition

### Evolution Mechanics

#### Fitness Function
```
fitness = age + totalEnergyGained
```

#### Death and Reproduction
1. Entity dies when energy ≤ 0
2. Best living entity is selected as parent
3. New entity created with mutated neural network
4. Mutation rate: 10% of weights/biases
5. Mutation strength: Gaussian noise with σ = 0.1

#### Population Dynamics
- Fixed population size of 5 entities
- Continuous evolution (no generational batches)
- Fitness tracking across all deaths
- Evolution trend analysis

## 🔧 Architecture

### Project Structure
```
consciousness-world/
├── src/
│   ├── core/
│   │   └── ConsciousnessSimulation.js    # Main simulation controller
│   ├── neural/
│   │   └── NeuralNetwork.js              # Neural network implementation
│   ├── physics/
│   │   └── WorldPhysics.js               # World physics engine
│   ├── evolution/
│   │   ├── ConsciousEntity.js            # Individual consciousness units
│   │   └── PopulationManager.js          # Evolution and population dynamics
│   ├── visualization/
│   │   ├── WorldRenderer.js              # Canvas rendering engine
│   │   └── UIController.js               # User interface management
│   └── utils/                            # Utility functions
├── public/
│   ├── index.html                        # Main HTML interface
│   ├── styles.css                        # Comprehensive styling
│   └── main.js                           # Application entry point
├── docs/                                 # Documentation
├── server.js                             # Development server
└── package.json                          # Project configuration
```

### Key Classes

#### `ConsciousnessSimulation`
Main controller that orchestrates all simulation components, handles timing, events, and data collection.

#### `WorldPhysics`
Manages the two-dimensional world with temperature waves, catalyser fields, core lifecycle, and energy manifestations.

#### `ConsciousEntity`
Individual consciousness with neural network, sensory system, memory, and learning capabilities.

#### `PopulationManager`
Handles evolution, fitness tracking, death/birth cycles, and population statistics.

#### `NeuralNetwork`
Feedforward neural network with Gaussian initialization, mutation, and REINFORCE learning.

#### `WorldRenderer`
Canvas-based visualization with multi-layer rendering, entity selection, and interactive features.

## 📈 Data Analysis

### Exported Data Structure
```json
{
  "config": { /* Simulation configuration */ },
  "sessionStats": {
    "startTime": 1234567890,
    "totalTicks": 5000,
    "totalGenerations": 47,
    "peakFitness": 834,
    "longestSurvival": 623
  },
  "finalState": {
    "worldState": { /* Current world state */ },
    "populationStats": { /* Population metrics */ },
    "entities": [ /* Individual entity details */ ]
  },
  "recordedData": [ /* Time series data */ ]
}
```

### Metrics Tracked
- Individual fitness (age + energy gained)
- Population survival rates
- Evolution trends and improvements
- Energy acquisition patterns
- Spatial movement analysis
- Neural network performance

## 🛠 Configuration

### Simulation Parameters
Edit `CONFIG` in `public/main.js`:

```javascript
const CONFIG = {
    gridSize: 100,          // World grid size
    cellSize: 5,           // Pixel size per grid cell
    populationSize: 5,     // Number of conscious entities
    tickRate: 5,          // Initial ticks per second
    autoSave: true,       // Enable automatic state saving
    dataRecording: false, // Start with data recording disabled
    debug: false          // Debug mode
};
```

### Evolution Parameters
Modify in `PopulationManager.js`:
- `mutationRate`: Probability of mutating each weight/bias (default: 0.1)
- `mutationStrength`: Standard deviation of mutation noise (default: 0.1)

### Neural Network Architecture
Adjust in `ConsciousEntity.js`:
- `hiddenSizes`: Array of hidden layer sizes (default: [256, 128, 64])
- `memoryCapacity`: Size of experience memory buffer (default: 50)

## 🐛 Development

### Debug Mode
Enable debug mode in the configuration:
```javascript
const CONFIG = {
    // ...
    debug: true
};
```

Debug features:
- Performance monitoring
- Detailed console logging
- Development tools (`window.devTools`)
- Slow step warnings

### Development Tools
With debug mode enabled, use `window.devTools`:
```javascript
devTools.killRandomEntity()    // Kill a random entity
devTools.addEnergy(50)         // Add energy to all entities
devTools.setSpeed(10)          // Set simulation speed
devTools.exportState()         // Export current state
```

### Testing
```bash
npm test                       # Run tests
npm run lint                   # Lint source code
npm run format                 # Format code
```

## 📚 Scientific Background

### Theoretical Foundation
This simulation explores concepts from:
- **Artificial Life**: Emergence of complex behavior from simple rules
- **Computational Neuroscience**: Neural network-based decision making
- **Evolutionary Computation**: Genetic algorithms and fitness landscapes
- **Embodied Cognition**: Consciousness through environmental interaction
- **Complex Systems**: Multi-scale dynamics and emergent properties

### Key Innovations
1. **Raw Sensory Fields**: Entities must decode abstract physical properties rather than receiving preprocessed information
2. **Temporal Memory Integration**: Experience-based learning with decay and context
3. **Multi-Modal Learning**: Combination of evolutionary and reinforcement learning
4. **Layered Reality**: Complex world physics with dimensional interactions
5. **Continuous Evolution**: Real-time evolution without generational batches

### Research Applications
- Studying emergence of consciousness in artificial systems
- Investigating the role of embodiment in cognition
- Exploring evolution of neural network architectures
- Understanding complex adaptive systems
- Testing theories of artificial life and intelligence

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Areas for Enhancement
- Additional sensory modalities
- More complex neural architectures
- Advanced learning algorithms
- Multi-agent communication
- Behavioral analysis tools
- Performance optimizations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by artificial life research and complex systems theory
- Built with modern web technologies and ES6 modules
- Visualization inspired by scientific simulation interfaces
- Neural network implementation based on established architectures

## 📞 Support

For questions, issues, or discussions:
- Open an issue on GitHub
- Check the [documentation](docs/)
- Review the code comments for implementation details

---

*Consciousness World - Exploring artificial consciousness through simulation* 🧠✨