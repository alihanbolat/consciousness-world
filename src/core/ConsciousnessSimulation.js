/**
 * Consciousness Simulation - Main simulation controller
 * 
 * Orchestrates all components of the consciousness simulation:
 * - World physics and dimensional dynamics
 * - Population of conscious entities
 * - Evolution and genetic algorithms
 * - Real-time visualization and interaction
 * - Data collection and analysis
 */

import { WorldPhysics } from '../physics/WorldPhysics.js';
import { PopulationManager } from '../evolution/PopulationManager.js';
import { WorldRenderer } from '../visualization/WorldRenderer.js';
import { UIController } from '../visualization/UIController.js';
import { DatabaseAPI } from '../utils/DatabaseAPI.js';

export class ConsciousnessSimulation {
    constructor(canvasId, options = {}) {
        // Configuration
        this.config = {
            gridSize: options.gridSize || 100,
            cellSize: options.cellSize || 5,
            populationSize: options.populationSize || 5,
            tickRate: options.tickRate || 5, // ticks per second
            autoSave: options.autoSave || false,
            debug: options.debug || false,
            enableDatabase: options.enableDatabase !== false, // Default to enabled
            databasePath: options.databasePath || 'data/consciousness-evolution.db',
            ...options
        };
        
        // Core systems
        this.world = new WorldPhysics(this.config.gridSize);
        this.population = new PopulationManager(this.config.populationSize, this.config.gridSize);
        this.renderer = new WorldRenderer(canvasId, this.config.gridSize, this.config.cellSize);
        this.ui = new UIController();
        
        // Database system (API client for browser)
        this.dbAPI = new DatabaseAPI();
        this.currentSessionId = null;
        
        // Check database connectivity
        this.dbAPI.checkStatus().then(status => {
            if (status.database === 'connected') {
                console.log('🗄️ Database API connected');
            } else {
                console.warn('⚠️ Database API not available:', status.error || 'Unknown error');
            }
        });
        
        // Simulation state
        this.isRunning = false;
        this.animationId = null;
        this.tickInterval = 1000 / this.config.tickRate;
        this.lastTick = 0;
        this.paused = false;
        
        // Statistics and analysis
        this.sessionStats = {
            startTime: Date.now(),
            totalTicks: 0,
            totalGenerations: 0,
            peakFitness: 0,
            longestSurvival: 0
        };
        
        // Data collection
        this.dataRecording = options.dataRecording || false;
        this.recordedData = [];
        
        // Initialize
        this.initialize();
    }
    
    /**
     * Initialize all systems and event listeners
     */
    initialize() {
        // Initialize UI
        this.ui.initialize();
        
        // Setup renderer mouse events
        this.renderer.setupMouseEvents();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial render
        this.render();
        this.ui.updateUI(this.world, this.population, this.renderer);
        
        if (this.config.debug) {
            console.log('Consciousness Simulation initialized:', this.config);
        }
    }
    
    /**
     * Setup event listeners for UI interactions
     */
    setupEventListeners() {
        // Simulation control events
        document.addEventListener('simulationToggle', (event) => {
            if (event.detail.isRunning) {
                this.start();
            } else {
                this.stop();
            }
        });
        
        document.addEventListener('speedChange', (event) => {
            this.setTickRate(1000 / event.detail.tickInterval);
        });
        
        // Single step event
        document.addEventListener('keydown', (event) => {
            if (event.key === ' ' && !this.isRunning) {
                event.preventDefault();
                this.step();
            }
        });
        
        // Reset event
        document.addEventListener('keydown', (event) => {
            if (event.key === 'r' || event.key === 'R') {
                event.preventDefault();
                this.reset();
            }
        });
        
        // Entity selection events
        document.addEventListener('entitySelected', (event) => {
            const entityIndex = event.detail.entityIndex;
            const entities = this.population.getLivingEntities();
            const selectedEntity = entityIndex >= 0 ? entities[entityIndex] : null;
            this.selectEntity(selectedEntity);
        });
        
        // Visualization toggle events
        document.addEventListener('visualizationToggle', (event) => {
            const { controlId, enabled } = event.detail;
            this.toggleVisualization(controlId, enabled);
        });
        
        // Grid click events for entity selection
        this.renderer.canvas.addEventListener('gridClick', (event) => {
            const { x, y } = event.detail;
            this.selectEntityAtPosition(x, y);
        });
        
        // Force evolution event
        document.addEventListener('forceEvolution', () => {
            this.population.forceEvolution();
            this.ui.showNotification('Forced evolution event triggered', 'info');
        });
        
        // Data export event
        document.addEventListener('exportData', () => {
            this.exportData();
        });
        
        // Auto-save functionality
        if (this.config.autoSave) {
            setInterval(() => {
                this.saveState();
            }, 30000); // Save every 30 seconds
        }
    }
    
    /**
     * Start the simulation
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.paused = false;
        this.lastTick = Date.now();
        
        // Start new database session
        if (!this.currentSessionId) {
            const sessionName = `Simulation ${new Date().toISOString()}`;
            const sessionDescription = `Consciousness simulation with ${this.config.populationSize} entities`;
            this.dbAPI.startSession(sessionName, sessionDescription, this.config).then(sessionId => {
                if (sessionId) {
                    this.currentSessionId = sessionId;
                    console.log('📊 Database session started:', sessionId);
                    
                    // Register initial population
                    const initialEntities = this.population.getLivingEntities();
                    this.dbAPI.registerInitialPopulation(initialEntities, 0, 0);
                }
            });
        }
        
        this.animationId = setInterval(() => {
            this.step();
        }, this.tickInterval);
        
        this.ui.updateControlStates(true);
        
        if (this.config.debug) {
            console.log('Simulation started');
        }
    }
    
    /**
     * Stop the simulation
     */
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.animationId) {
            clearInterval(this.animationId);
            this.animationId = null;
        }
        
        // End database session
        if (this.currentSessionId) {
            const stats = this.population.getPopulationStats();
            this.dbAPI.endSession(
                this.sessionStats.totalTicks,
                stats.totalDeaths + this.config.populationSize,
                stats.bestAllTimeFitness
            );
            this.currentSessionId = null;
        }
        
        this.ui.updateControlStates(false);
        
        if (this.config.debug) {
            console.log('Simulation stopped');
        }
    }
    
    /**
     * Step the simulation forward one tick
     */
    step() {
        const startTime = performance.now();
        
        // Step world physics
        this.world.step();
        
        // Update population with database API
        this.population.update(this.world, this.world.tick, this.dbAPI, this.currentSessionId);
        
        // Record generation statistics periodically
        if (this.world.tick % 10 === 0) {
            this.population.recordGenerationStats(this.world.tick);
        }
        
        // Database logging through API
        if (this.currentSessionId) {
            // Record population stats every tick
            const stats = this.population.getPopulationStats();
            const worldState = this.world.getWorldState();
            this.dbAPI.recordPopulationStats(this.world.tick, stats, worldState);
            
            // Neural network storage is disabled by default in DatabaseAPI
            // Can be re-enabled later once entity serialization is properly handled
            if (this.world.tick % 100 === 0) {
                // Only store one random entity's network very rarely
                const livingEntities = this.population.getLivingEntities();
                if (livingEntities.length > 0) {
                    const randomEntity = livingEntities[Math.floor(Math.random() * livingEntities.length)];
                    this.dbAPI.storeNeuralNetwork(randomEntity, this.world.tick, stats.generation);
                }
            }
        }
        
        // Update session statistics
        this.updateSessionStats();
        
        // Record data if enabled
        if (this.dataRecording) {
            this.recordDataPoint();
        }
        
        // Render and update UI
        this.render();
        this.ui.updateUI(this.world, this.population, this.renderer);
        
        // Performance monitoring
        const stepTime = performance.now() - startTime;
        if (this.config.debug && stepTime > 50) {
            console.warn(`Slow simulation step: ${stepTime.toFixed(2)}ms`);
        }
        
        this.sessionStats.totalTicks++;
    }
    
    /**
     * Render the current state
     */
    render() {
        this.renderer.render(this.world, this.population);
    }
    
    /**
     * Reset the simulation to initial state
     */
    reset() {
        const wasRunning = this.isRunning;
        
        if (this.isRunning) {
            this.stop();
        }
        
        // Reset all systems
        this.world.reset();
        this.population.reset();
        
        // Clear visualization
        this.renderer.clearPaths();
        this.selectEntity(null);
        
        // Reset session stats
        this.sessionStats = {
            startTime: Date.now(),
            totalTicks: 0,
            totalGenerations: 0,
            peakFitness: 0,
            longestSurvival: 0
        };
        
        // Clear recorded data
        this.recordedData = [];
        
        // Render initial state
        this.render();
        this.ui.updateUI(this.world, this.population, this.renderer);
        
        this.ui.showNotification('Simulation reset', 'info');
        
        if (wasRunning) {
            this.start();
        }
        
        if (this.config.debug) {
            console.log('Simulation reset');
        }
    }
    
    /**
     * Set the tick rate (ticks per second)
     */
    setTickRate(ticksPerSecond) {
        this.tickInterval = 1000 / ticksPerSecond;
        
        if (this.isRunning) {
            clearInterval(this.animationId);
            this.animationId = setInterval(() => {
                this.step();
            }, this.tickInterval);
        }
        
        if (this.config.debug) {
            console.log(`Tick rate set to ${ticksPerSecond} ticks/second`);
        }
    }
    
    /**
     * Select an entity for detailed observation
     */
    selectEntity(entity) {
        this.renderer.selectEntity(entity);
        this.ui.setSelectedEntity(entity);
        
        if (entity) {
            this.ui.showNotification(`Selected entity ${entity.id}`, 'info', 1000);
        }
    }
    
    /**
     * Select entity at specific grid position
     */
    selectEntityAtPosition(x, y) {
        const entities = this.population.getLivingEntities();
        const entityAtPosition = entities.find(entity => entity.x === x && entity.y === y);
        
        if (entityAtPosition) {
            this.selectEntity(entityAtPosition);
        } else {
            this.selectEntity(null);
        }
    }
    
    /**
     * Toggle visualization options
     */
    toggleVisualization(controlId, enabled) {
        const visualizationMap = {
            'showTemperature': 'showTemperature',
            'showCatalyser': 'showCatalyser',
            'showCores': 'showCores',
            'showEnergies': 'showEnergies',
            'showEntities': 'showEntities',
            'showEntityPaths': 'showEntityPaths'
        };
        
        const rendererProperty = visualizationMap[controlId];
        if (rendererProperty && this.renderer.hasOwnProperty(rendererProperty)) {
            this.renderer[rendererProperty] = enabled;
            
            if (controlId === 'showEntityPaths' && !enabled) {
                this.renderer.clearPaths();
            }
            
            if (this.config.debug) {
                console.log(`${controlId} ${enabled ? 'enabled' : 'disabled'}`);
            }
        }
    }
    
    /**
     * Update session statistics
     */
    updateSessionStats() {
        const stats = this.population.getPopulationStats();
        
        this.sessionStats.totalGenerations = stats.generation;
        this.sessionStats.peakFitness = Math.max(this.sessionStats.peakFitness, stats.bestAllTimeFitness);
        
        // Track longest individual survival
        const livingEntities = this.population.getLivingEntities();
        if (livingEntities.length > 0) {
            const maxAge = Math.max(...livingEntities.map(entity => entity.age));
            this.sessionStats.longestSurvival = Math.max(this.sessionStats.longestSurvival, maxAge);
        }
    }
    
    /**
     * Record data point for analysis
     */
    recordDataPoint() {
        const worldState = this.world.getWorldState();
        const populationStats = this.population.getPopulationStats();
        
        this.recordedData.push({
            timestamp: Date.now(),
            tick: worldState.tick,
            worldState,
            populationStats,
            entities: this.population.getEntityDetails()
        });
        
        // Keep only recent data (last 1000 points)
        if (this.recordedData.length > 1000) {
            this.recordedData.shift();
        }
    }
    
    /**
     * Export simulation data
     */
    exportData() {
        const exportData = {
            config: this.config,
            sessionStats: this.sessionStats,
            finalState: {
                worldState: this.world.getWorldState(),
                populationStats: this.population.getPopulationStats(),
                entities: this.population.getEntityDetails(),
                populationExport: this.population.exportPopulationState()
            },
            recordedData: this.dataRecording ? this.recordedData : [],
            exportTime: Date.now()
        };
        
        // Create downloadable file
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `consciousness-simulation-${Date.now()}.json`;
        link.click();
        
        this.ui.showNotification('Simulation data exported', 'success');
        
        if (this.config.debug) {
            console.log('Data exported:', exportData);
        }
    }
    
    /**
     * Save current simulation state to localStorage
     */
    saveState() {
        try {
            const state = {
                config: this.config,
                worldState: this.world.getWorldState(),
                populationState: this.population.exportPopulationState(),
                sessionStats: this.sessionStats,
                uiState: this.ui.exportUIState(),
                saveTime: Date.now()
            };
            
            localStorage.setItem('consciousnessSimulationState', JSON.stringify(state));
            
            if (this.config.debug) {
                console.log('State saved to localStorage');
            }
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }
    
    /**
     * Load simulation state from localStorage
     */
    loadState() {
        try {
            const savedState = localStorage.getItem('consciousnessSimulationState');
            if (!savedState) return false;
            
            const state = JSON.parse(savedState);
            
            // Load UI state
            this.ui.importUIState(state.uiState);
            
            // Load session stats
            this.sessionStats = { ...this.sessionStats, ...state.sessionStats };
            
            this.ui.showNotification('Simulation state loaded', 'success');
            
            if (this.config.debug) {
                console.log('State loaded from localStorage');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to load state:', error);
            return false;
        }
    }
    
    /**
     * Enable or disable data recording
     */
    setDataRecording(enabled) {
        this.dataRecording = enabled;
        if (!enabled) {
            this.recordedData = [];
        }
        
        if (this.config.debug) {
            console.log(`Data recording ${enabled ? 'enabled' : 'disabled'}`);
        }
    }
    
    /**
     * Get current simulation status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.paused,
            tickRate: 1000 / this.tickInterval,
            currentTick: this.world.tick,
            sessionStats: this.sessionStats,
            config: this.config
        };
    }
    
    /**
     * Cleanup and destroy simulation
     */
    destroy() {
        this.stop();
        
        // Clear any remaining timers
        if (this.animationId) {
            clearInterval(this.animationId);
        }
        
        // Remove event listeners
        // (In a real implementation, you'd need to track and remove all listeners)
        
        // Clear canvas
        this.renderer.ctx.clearRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);
        
        if (this.config.debug) {
            console.log('Simulation destroyed');
        }
    }
}