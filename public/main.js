/**
 * Main entry point for Consciousness World simulation
 * 
 * Initializes and starts the consciousness simulation with all components
 */

import { ConsciousnessSimulation } from '../src/core/ConsciousnessSimulation.js';

// Configuration for the simulation
const CONFIG = {
    gridSize: 100,          // World grid size
    cellSize: 5,           // Pixel size per grid cell
    populationSize: 5,     // Number of conscious entities
    tickRate: 5,          // Initial ticks per second
    autoSave: true,       // Enable automatic state saving
    dataRecording: false, // Start with data recording disabled
    debug: false          // Debug mode
};

// Global simulation instance
let simulation = null;

/**
 * Initialize the simulation
 */
async function initializeSimulation() {
    try {
        console.log('Initializing Consciousness World...');
        
        // Create simulation instance
        simulation = new ConsciousnessSimulation('worldCanvas', CONFIG);
        
        // Make simulation available globally for debugging and HTML controls
        window.simulation = simulation;
        
        // Setup additional event handlers
        setupAdditionalHandlers();
        
        // Try to load saved state
        const stateLoaded = simulation.loadState();
        if (stateLoaded) {
            console.log('Loaded previous simulation state');
        }
        
        // Hide loading screen
        hideLoadingScreen();
        
        console.log('Consciousness World initialized successfully');
        
        // Show welcome message
        setTimeout(() => {
            simulation.ui.showNotification('Consciousness World initialized! Press Space to step, R to reset.', 'success', 5000);
        }, 500);
        
    } catch (error) {
        console.error('Failed to initialize simulation:', error);
        showError('Failed to initialize simulation. Please refresh the page.');
    }
}

/**
 * Setup additional event handlers
 */
function setupAdditionalHandlers() {
    // Handle page visibility changes (pause when tab is hidden)
    document.addEventListener('visibilitychange', () => {
        if (simulation && simulation.isRunning) {
            if (document.hidden) {
                console.log('Tab hidden, pausing simulation');
                simulation.paused = true;
            } else {
                console.log('Tab visible, resuming simulation');
                simulation.paused = false;
            }
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (simulation) {
            // Optionally adjust canvas size on resize
            // simulation.renderer.setCanvasSize(newWidth, newHeight);
        }
    });
    
    // Handle before unload (save state)
    window.addEventListener('beforeunload', () => {
        if (simulation && CONFIG.autoSave) {
            simulation.saveState();
        }
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (!simulation) return;
        
        // Don't trigger shortcuts if user is typing in an input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
            return;
        }
        
        switch (event.key.toLowerCase()) {
            case ' ':
                event.preventDefault();
                if (!simulation.isRunning) {
                    simulation.step();
                }
                break;
                
            case 'r':
                event.preventDefault();
                if (confirm('Are you sure you want to reset the simulation?')) {
                    simulation.reset();
                }
                break;
                
            case 's':
                event.preventDefault();
                if (simulation.isRunning) {
                    simulation.stop();
                } else {
                    simulation.start();
                }
                break;
                
            case 'e':
                event.preventDefault();
                simulation.exportData();
                break;
                
            case 'p':
                event.preventDefault();
                simulation.population.forceEvolution();
                break;
                
            case 'd':
                event.preventDefault();
                const recording = !simulation.dataRecording;
                simulation.setDataRecording(recording);
                simulation.ui.showNotification(`Data recording ${recording ? 'enabled' : 'disabled'}`, 'info');
                break;
                
            case 'escape':
                event.preventDefault();
                simulation.selectEntity(null);
                break;
        }
    });
}

/**
 * Hide the loading screen
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 300);
    }
}

/**
 * Show error message
 */
function showError(message) {
    const loadingScreen = document.getElementById('loading');
    if (loadingScreen) {
        loadingScreen.innerHTML = `
            <div style="color: #ff4444; font-size: 20px; margin-bottom: 20px;">⚠️ Error</div>
            <div>${message}</div>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #ff4444; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Reload Page
            </button>
        `;
    }
}

/**
 * Setup development tools (only in debug mode)
 */
function setupDevTools() {
    if (!CONFIG.debug) return;
    
    // Add development tools to window for debugging
    window.devTools = {
        simulation,
        
        // Quick access to major components
        get world() { return simulation?.world; },
        get population() { return simulation?.population; },
        get renderer() { return simulation?.renderer; },
        
        // Utility functions
        killRandomEntity() {
            const entities = simulation.population.getLivingEntities();
            if (entities.length > 0) {
                const randomEntity = entities[Math.floor(Math.random() * entities.length)];
                randomEntity.energy = 0;
                console.log(`Killed entity ${randomEntity.id}`);
            }
        },
        
        addEnergy(amount = 50) {
            const entities = simulation.population.getLivingEntities();
            entities.forEach(entity => {
                entity.energy += amount;
            });
            console.log(`Added ${amount} energy to all entities`);
        },
        
        setSpeed(ticksPerSecond) {
            simulation.setTickRate(ticksPerSecond);
            console.log(`Set speed to ${ticksPerSecond} ticks/second`);
        },
        
        exportState() {
            const state = {
                world: simulation.world.getWorldState(),
                population: simulation.population.exportPopulationState(),
                config: CONFIG
            };
            console.log('Current state:', state);
            return state;
        }
    };
    
    console.log('Debug mode enabled. Use window.devTools for debugging utilities.');
}

/**
 * Handle errors globally
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (simulation && simulation.ui) {
        simulation.ui.showNotification('An error occurred. Check console for details.', 'error');
    }
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (simulation && simulation.ui) {
        simulation.ui.showNotification('An error occurred. Check console for details.', 'error');
    }
});

/**
 * Initialize when DOM is loaded
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSimulation);
} else {
    initializeSimulation();
}

// Setup development tools
setupDevTools();

// Performance monitoring
if (CONFIG.debug) {
    let frameCount = 0;
    let lastTime = Date.now();
    
    setInterval(() => {
        const now = Date.now();
        const fps = frameCount / ((now - lastTime) / 1000);
        console.log(`Performance: ${fps.toFixed(1)} FPS, ${simulation?.sessionStats?.totalTicks || 0} total ticks`);
        frameCount = 0;
        lastTime = now;
    }, 5000);
    
    // Count frames
    const originalRender = simulation?.render;
    if (originalRender) {
        simulation.render = function() {
            frameCount++;
            originalRender.call(this);
        };
    }
}

// Export for use in other modules if needed
export { simulation, CONFIG };