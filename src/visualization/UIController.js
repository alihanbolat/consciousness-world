/**
 * UI Controller - Manages the user interface and controls
 * 
 * Features:
 * - Real-time statistics display
 * - Simulation controls (start/stop/reset/step)
 * - Entity detail panels
 * - Evolution tracking
 * - Visual configuration options
 */

export class UIController {
    constructor() {
        this.isRunning = false;
        this.tickInterval = 200; // ms between ticks
        this.selectedEntity = null;
        
        // UI element references
        this.elements = {
            phaseIndicator: null,
            worldStats: null,
            cellVision: null,
            toggleBtn: null,
            speedSlider: null,
            speedValue: null
        };
        
        // Bind methods
        this.updateUI = this.updateUI.bind(this);
        this.toggleSimulation = this.toggleSimulation.bind(this);
        this.updateSpeed = this.updateSpeed.bind(this);
    }
    
    /**
     * Initialize UI elements and event listeners
     */
    initialize() {
        // Get UI element references
        this.elements.phaseIndicator = document.getElementById('phaseIndicator');
        this.elements.worldStats = document.getElementById('worldStats');
        this.elements.cellVision = document.getElementById('cellVision');
        this.elements.toggleBtn = document.getElementById('toggleBtn');
        this.elements.speedSlider = document.getElementById('speedSlider');
        this.elements.speedValue = document.getElementById('speedValue');
        
        // Setup event listeners
        if (this.elements.toggleBtn) {
            this.elements.toggleBtn.addEventListener('click', this.toggleSimulation);
        }
        
        if (this.elements.speedSlider) {
            this.elements.speedSlider.addEventListener('change', this.updateSpeed);
            this.elements.speedSlider.addEventListener('input', this.updateSpeed);
        }
        
        // Setup additional controls
        this.setupAdditionalControls();
    }
    
    /**
     * Setup additional control elements
     */
    setupAdditionalControls() {
        // Entity selection controls
        const entitySelector = document.getElementById('entitySelector');
        if (entitySelector) {
            entitySelector.addEventListener('change', (event) => {
                const entityIndex = parseInt(event.target.value);
                this.onEntitySelected(entityIndex);
            });
        }
        
        // Visualization toggles
        const visControls = document.querySelectorAll('.vis-control');
        visControls.forEach(control => {
            control.addEventListener('change', (event) => {
                this.onVisualizationToggle(event.target.id, event.target.checked);
            });
        });
        
        // Evolution controls
        const forceEvolutionBtn = document.getElementById('forceEvolution');
        if (forceEvolutionBtn) {
            forceEvolutionBtn.addEventListener('click', this.onForceEvolution);
        }
        
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', this.onExportData);
        }
    }
    
    /**
     * Update all UI elements with current state
     */
    updateUI(world, population, renderer) {
        this.updatePhaseIndicator(world);
        this.updateWorldStats(world, population);
        this.updateEntityDetails(population);
        this.updateEntitySelector(population);
        this.updateEvolutionChart(population);
    }
    
    /**
     * Update phase indicator
     */
    updatePhaseIndicator(world) {
        if (!this.elements.phaseIndicator) return;
        
        this.elements.phaseIndicator.textContent = `${world.phase.toUpperCase()} PHASE`;
        this.elements.phaseIndicator.className = `phase-indicator ${world.phase}-phase`;
    }
    
    /**
     * Update world statistics panel
     */
    updateWorldStats(world, population) {
        if (!this.elements.worldStats) return;
        
        const stats = population.getPopulationStats();
        const worldState = world.getWorldState();
        
        this.elements.worldStats.innerHTML = `
            <div>Tick: ${worldState.tick}</div>
            <div>Cycle: ${Math.floor(worldState.tick / 100)} (${worldState.tick % 100}/100)</div>
            <div>Generation: ${stats.generation}</div>
            <div>Population: ${stats.livingCount}/5 cells alive</div>
            <div>Total Deaths: ${stats.totalDeaths}</div>
            <div>Best Fitness: ${stats.bestAllTimeFitness}</div>
            <div>Avg Fitness: ${stats.averageFitness}</div>
            <div>Pop. Energy: ${stats.totalEnergy}</div>
            <div>Pop. Age: ${stats.totalAge}</div>
            <div>Active Energy: ${worldState.activeEnergies}</div>
            <div>Cores: D:${worldState.coreStates.dormant} I:${worldState.coreStates.incubated} B:${worldState.coreStates.bloomed}</div>
        `;
    }
    
    /**
     * Update entity details panel
     */
    updateEntityDetails(population) {
        if (!this.elements.cellVision) return;
        
        const livingEntities = population.getLivingEntities();
        
        if (livingEntities.length === 0) {
            this.elements.cellVision.innerHTML = `<div>No living entities to observe</div>`;
            return;
        }
        
        // Show details for selected entity or first living entity
        const targetEntity = this.selectedEntity || livingEntities[0];
        
        if (!targetEntity || !targetEntity.vision || targetEntity.vision.length === 0) {
            this.elements.cellVision.innerHTML = `<div>Entity has no vision data</div>`;
            return;
        }
        
        // Get immediate sensory data
        const immediateData = targetEntity.vision.find(v => v.distance === 0);
        
        if (immediateData) {
            this.elements.cellVision.innerHTML = `
                <div><strong>Entity #${targetEntity.id} Raw Fields & Memory:</strong></div>
                <div>Field1 (Thermal Flux): ${immediateData.field1.toFixed(3)}</div>
                <div>Field2 (Matter Resonance): ${immediateData.field2.toFixed(3)}</div>
                <div>Field3 (Energy Potential): ${immediateData.field3.toFixed(3)}</div>
                <div>Field4 (Spatial Gradient): ${immediateData.field4.toFixed(3)}</div>
                <div>Field5 (Life Force): ${immediateData.field5.toFixed(3)}</div>
                <div>Confidence: ${immediateData.confidence.toFixed(3)}</div>
                <div><strong>Energy: ${Math.round(targetEntity.energy)}</strong></div>
                <div><strong>Age: ${targetEntity.age}</strong></div>
                <div><strong>Fitness: ${Math.round(targetEntity.fitness)}</strong></div>
                <div><strong>Memories: ${targetEntity.memory ? targetEntity.memory.length : 0}/${targetEntity.memoryCapacity}</strong></div>
                <div><strong>Last Action: ${targetEntity.lastAction}</strong></div>
                <div><br><strong>Recent Memory:</strong></div>
                <div style="font-size: 9px;">
                    ${targetEntity.memory && targetEntity.memory.length > 0 ? 
                        (() => {
                            const recent = targetEntity.memory[targetEntity.memory.length - 1];
                            return `Tick ${recent.tick}: (${recent.x},${recent.y}) → ${recent.outcome}`;
                        })() : 'No memories yet'}
                </div>
                <div><br><strong>Neural Network:</strong></div>
                <div style="font-size: 9px;">
                    Architecture: ${targetEntity.brain.layers.length} layers
                    <br>Parameters: ${targetEntity.brain.getArchitecture().totalParameters}
                </div>
            `;
        }
    }
    
    /**
     * Update entity selector dropdown
     */
    updateEntitySelector(population) {
        const selector = document.getElementById('entitySelector');
        if (!selector) return;
        
        const livingEntities = population.getLivingEntities();
        
        // Clear existing options
        selector.innerHTML = '<option value="-1">Select Entity</option>';
        
        // Add living entities
        livingEntities.forEach((entity, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Entity ${entity.id} (E:${Math.round(entity.energy)} A:${entity.age})`;
            if (this.selectedEntity && this.selectedEntity.id === entity.id) {
                option.selected = true;
            }
            selector.appendChild(option);
        });
    }
    
    /**
     * Update evolution chart (placeholder for future chart implementation)
     */
    updateEvolutionChart(population) {
        const chartContainer = document.getElementById('evolutionChart');
        if (!chartContainer) return;
        
        const trends = population.getEvolutionTrends();
        const stats = population.getPopulationStats();
        
        chartContainer.innerHTML = `
            <div><strong>Evolution Trends:</strong></div>
            <div>Fitness Improvement: ${trends.fitnessImprovement > 0 ? '+' : ''}${trends.fitnessImprovement.toFixed(2)}</div>
            <div>Survival Rate: ${(trends.survivalRate * 100).toFixed(1)}%</div>
            <div>Population Stable: ${trends.populationStability ? 'Yes' : 'No'}</div>
        `;
    }
    
    /**
     * Toggle simulation running state
     */
    toggleSimulation() {
        this.isRunning = !this.isRunning;
        
        if (this.elements.toggleBtn) {
            this.elements.toggleBtn.textContent = this.isRunning ? 'Stop Simulation' : 'Start Simulation';
        }
        
        // Emit event for simulation controller
        document.dispatchEvent(new CustomEvent('simulationToggle', {
            detail: { isRunning: this.isRunning }
        }));
    }
    
    /**
     * Update simulation speed
     */
    updateSpeed() {
        if (!this.elements.speedSlider || !this.elements.speedValue) return;
        
        const speed = parseInt(this.elements.speedSlider.value);
        this.tickInterval = 1000 / speed;
        this.elements.speedValue.textContent = speed;
        
        // Emit event for simulation controller
        document.dispatchEvent(new CustomEvent('speedChange', {
            detail: { tickInterval: this.tickInterval }
        }));
    }
    
    /**
     * Handle entity selection
     */
    onEntitySelected = (entityIndex) => {
        document.dispatchEvent(new CustomEvent('entitySelected', {
            detail: { entityIndex }
        }));
    }
    
    /**
     * Handle visualization toggle
     */
    onVisualizationToggle = (controlId, enabled) => {
        document.dispatchEvent(new CustomEvent('visualizationToggle', {
            detail: { controlId, enabled }
        }));
    }
    
    /**
     * Handle force evolution
     */
    onForceEvolution = () => {
        document.dispatchEvent(new CustomEvent('forceEvolution'));
    }
    
    /**
     * Handle data export
     */
    onExportData = () => {
        document.dispatchEvent(new CustomEvent('exportData'));
    }
    
    /**
     * Set selected entity
     */
    setSelectedEntity(entity) {
        this.selectedEntity = entity;
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '10px 20px',
            backgroundColor: type === 'error' ? '#ff4444' : 
                           type === 'success' ? '#44ff44' : 
                           type === 'warning' ? '#ffaa44' : '#4444ff',
            color: 'white',
            borderRadius: '5px',
            zIndex: '1000',
            opacity: '0',
            transition: 'opacity 0.3s'
        });
        
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Fade out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    /**
     * Update control states
     */
    updateControlStates(isRunning) {
        this.isRunning = isRunning;
        
        if (this.elements.toggleBtn) {
            this.elements.toggleBtn.textContent = isRunning ? 'Stop Simulation' : 'Start Simulation';
        }
        
        // Disable/enable other controls based on running state
        const stepBtn = document.getElementById('stepBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        if (stepBtn) stepBtn.disabled = isRunning;
        if (resetBtn) resetBtn.disabled = isRunning;
    }
    
    /**
     * Export current UI state
     */
    exportUIState() {
        return {
            isRunning: this.isRunning,
            tickInterval: this.tickInterval,
            selectedEntityId: this.selectedEntity?.id || null,
            speed: this.elements.speedSlider?.value || 5
        };
    }
    
    /**
     * Import UI state
     */
    importUIState(state) {
        if (state.isRunning !== undefined) {
            this.updateControlStates(state.isRunning);
        }
        
        if (state.tickInterval !== undefined) {
            this.tickInterval = state.tickInterval;
        }
        
        if (state.speed !== undefined && this.elements.speedSlider) {
            this.elements.speedSlider.value = state.speed;
            this.updateSpeed();
        }
    }
}