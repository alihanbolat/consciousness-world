/**
 * World Physics Engine for Consciousness Simulation
 * 
 * Manages the two-dimensional layered reality:
 * - Lower Dimension: Temperature waves, catalyser fields, cores, and energy manifestations
 * - Upper Dimension: Catalyser density fields that interact with lower dimension
 * 
 * Core Physics:
 * - Temperature waves create dynamic thermal landscapes
 * - Catalyser fields enable core incubation and energy bloom cycles
 * - Cores go through dormant → incubated → bloomed states
 * - Energy manifestations provide sustenance for conscious entities
 */

export class WorldPhysics {
    constructor(gridSize = 100) {
        this.gridSize = gridSize;
        this.tick = 0;
        this.phase = 'emit'; // 'emit' or 'collect'
        
        // Initialize dimensional layers
        this.lowerDimension = {
            temperature: this.generateTemperatureField(),
            catalyser: Array(gridSize).fill().map(() => Array(gridSize).fill(0)),
            cores: [],
            energies: []
        };
        
        this.upperDimension = {
            catalyser: Array(gridSize).fill().map(() => 
                Array(gridSize).fill().map(() => Math.random() * 2)
            )
        };
        
        this.initializeCores();
    }
    
    /**
     * Generate complex wave-based temperature patterns
     */
    generateTemperatureField() {
        const temperature = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
        
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                let temp = 0;
                
                // Primary wave - creates main hot/cold bands
                temp += Math.sin((x * 2 * Math.PI) / 30) * 0.4;
                
                // Secondary wave - adds variation
                temp += Math.sin((y * 2 * Math.PI) / 45) * 0.2;
                
                // Tertiary wave - creates more complex patterns
                temp += Math.sin(((x + y) * 2 * Math.PI) / 25) * 0.15;
                
                // Add some randomness for unpredictability
                temp += (Math.random() - 0.5) * 0.1;
                
                // Normalize to 0-1 range
                temperature[x][y] = Math.max(0, Math.min(1, (temp + 1) / 2));
            }
        }
        
        return temperature;
    }
    
    /**
     * Initialize cores randomly throughout the world
     */
    initializeCores() {
        this.lowerDimension.cores = [];
        const numCores = 50;
        
        for (let i = 0; i < numCores; i++) {
            this.lowerDimension.cores.push({
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize),
                state: 'dormant',
                incubationTime: 0,
                bloomTime: 0,
                temperatureExposure: 0,
                consecutiveHighTemp: 0,
                id: i
            });
        }
    }
    
    /**
     * Shift temperature patterns to create dynamic thermal waves
     */
    shiftTemperature() {
        const newTemperature = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
        
        // Shift right with wraparound
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const newX = (x + 1) % this.gridSize;
                newTemperature[newX][y] = this.lowerDimension.temperature[x][y];
            }
        }
        
        // Add diffusion to break synchronization
        const diffusionStrength = 0.1;
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                let diffusedTemp = newTemperature[x][y];
                let neighborCount = 0;
                let neighborSum = 0;
                
                // Average with neighbors
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = (x + dx + this.gridSize) % this.gridSize;
                        const ny = (y + dy + this.gridSize) % this.gridSize;
                        neighborSum += newTemperature[nx][ny];
                        neighborCount++;
                    }
                }
                
                if (neighborCount > 0) {
                    const avgNeighbor = neighborSum / neighborCount;
                    diffusedTemp = newTemperature[x][y] * (1 - diffusionStrength) + 
                                  avgNeighbor * diffusionStrength;
                }
                
                // Add small random noise
                diffusedTemp += (Math.random() - 0.5) * 0.02;
                
                newTemperature[x][y] = Math.max(0, Math.min(1, diffusedTemp));
            }
        }
        
        this.lowerDimension.temperature = newTemperature;
    }
    
    /**
     * Emit phase: Transfer catalyser from upper to lower dimension
     */
    emitPhase() {
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                this.lowerDimension.catalyser[x][y] += this.upperDimension.catalyser[x][y];
                this.upperDimension.catalyser[x][y] *= 0.8; // Decay
            }
        }
    }
    
    /**
     * Collect phase: Redistribute catalyser based on density gradients
     */
    collectPhase() {
        const newCatalyser = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
        
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const currentCatalyser = this.lowerDimension.catalyser[x][y];
                
                if (currentCatalyser > 0) {
                    let totalDensity = 0;
                    const neighbors = [];
                    
                    // Calculate neighbor densities
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            const nx = x + dx;
                            const ny = y + dy;
                            if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                                const density = this.upperDimension.catalyser[nx][ny];
                                neighbors.push({x: nx, y: ny, density});
                                totalDensity += density;
                            }
                        }
                    }
                    
                    // Redistribute proportionally
                    if (totalDensity > 0) {
                        neighbors.forEach(neighbor => {
                            const proportion = neighbor.density / totalDensity;
                            newCatalyser[neighbor.x][neighbor.y] += currentCatalyser * proportion;
                        });
                    }
                    
                    // Clear current position
                    this.lowerDimension.catalyser[x][y] = 0;
                }
            }
        }
        
        // Update upper dimension with collected catalyser
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                this.upperDimension.catalyser[x][y] += newCatalyser[x][y];
                this.upperDimension.catalyser[x][y] = Math.min(2, this.upperDimension.catalyser[x][y]);
            }
        }
    }
    
    /**
     * Update core states and energy manifestations
     */
    updateCores() {
        this.lowerDimension.cores.forEach(core => {
            // Handle delayed core movement
            if (core.moveAfterTick && this.tick >= core.moveAfterTick) {
                this.moveCore(core);
                delete core.moveAfterTick;
            }
            
            const catalyserAmount = this.lowerDimension.catalyser[core.x][core.y];
            const temperature = this.lowerDimension.temperature[core.x][core.y];
            
            // State transitions
            if (core.state === 'dormant' && catalyserAmount > 0.2) {
                core.state = 'incubated';
                core.incubationTime = this.tick;
                core.consecutiveHighTemp = 0;
            }
            
            if (core.state === 'incubated') {
                if (temperature > 0.2) {
                    core.consecutiveHighTemp++;
                    if (core.consecutiveHighTemp >= 5) {
                        core.state = 'bloomed';
                        core.bloomTime = this.tick;
                        
                        // Create energy manifestation
                        this.lowerDimension.energies.push({
                            x: core.x,
                            y: core.y,
                            createdAt: this.tick,
                            active: true,
                            coreId: core.id
                        });
                    }
                } else {
                    core.consecutiveHighTemp = 0;
                }
            }
            
            if (core.state === 'bloomed' && this.tick - core.bloomTime >= 5) {
                // Return to dormant state and release catalyser
                core.state = 'dormant';
                core.consecutiveHighTemp = 0;
                this.lowerDimension.catalyser[core.x][core.y] += 0.1;
                
                this.moveCore(core);
            }
        });
        
        // Clean up expired energies
        this.lowerDimension.energies = this.lowerDimension.energies.filter(energy => {
            if (this.tick - energy.createdAt >= 5) {
                energy.active = false;
                return false;
            }
            return true;
        });
    }
    
    /**
     * Move a core to an adjacent position
     */
    moveCore(core) {
        const moves = [
            {x: -1, y: -1}, {x: 0, y: -1}, {x: 1, y: -1},
            {x: -1, y: 0},                 {x: 1, y: 0},
            {x: -1, y: 1},  {x: 0, y: 1},  {x: 1, y: 1}
        ];
        const move = moves[Math.floor(Math.random() * moves.length)];
        core.x = (core.x + move.x + this.gridSize) % this.gridSize;
        core.y = (core.y + move.y + this.gridSize) % this.gridSize;
    }
    
    /**
     * Schedule a core to move after a delay
     */
    scheduleCoreMovement(coreId, delay = 3) {
        const core = this.lowerDimension.cores.find(c => c.id === coreId);
        if (core) {
            core.moveAfterTick = this.tick + delay;
        }
    }
    
    /**
     * Get raw physical properties at a specific position
     * This is the fundamental sensory interface for consciousness entities
     */
    getRawPhysicalProperties(x, y, distance = 0, observerEnergy = 100) {
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
            return { field1: 0, field2: 0, field3: 0, field4: 0, field5: 0, confidence: 0 };
        }
        
        const temp = this.lowerDimension.temperature[x][y];
        const catalyser = this.lowerDimension.catalyser[x][y];
        
        // Check for cores and energies
        const core = this.lowerDimension.cores.find(core => core.x === x && core.y === y);
        const coreState = core ? core.state : 'none';
        const hasEnergy = this.lowerDimension.energies.some(energy => 
            energy.x === x && energy.y === y && energy.active
        );
        
        // Encode core states
        const coreValue = coreState === 'none' ? 0 : 
                         coreState === 'dormant' ? 0.3 : 
                         coreState === 'incubated' ? 0.6 : 
                         coreState === 'bloomed' ? 0.9 : 0;
        
        const energyValue = hasEnergy ? 1.0 : 0;
        
        // Raw physical field calculations
        let field1 = (temp * 0.7 + catalyser * 0.3) * (1 + Math.sin(this.tick * 0.1) * 0.1);
        let field2 = (coreValue * 0.6 + temp * catalyser * 0.4) + Math.cos(this.tick * 0.05) * 0.1;
        let field3 = temp * catalyser * (1 + coreValue) + energyValue * 0.8;
        field3 += Math.sin((x + y + this.tick) * 0.1) * 0.1;
        let field4 = temp * 0.5 + catalyser * 0.3 + coreValue * 0.2;
        let field5 = 0; // Will be set by entities themselves for life force detection
        
        // Add spatial context from neighbors
        let neighborInfluence = 0;
        let neighborCount = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                    neighborInfluence += this.lowerDimension.temperature[nx][ny] + 
                                       this.lowerDimension.catalyser[nx][ny];
                    neighborCount++;
                }
            }
        }
        if (neighborCount > 0) {
            field4 += (neighborInfluence / neighborCount) * 0.2;
        }
        
        // Calculate confidence based on distance and observer energy
        const baseConfidence = distance === 0 ? 1.0 : 
                              distance === 1 ? 0.9 :
                              distance === 2 ? 0.7 :
                              distance === 3 ? 0.5 :
                              distance === 4 ? 0.3 : 0.1;
        
        const energyMultiplier = Math.max(0.1, Math.min(1.0, observerEnergy / 100.0));
        const finalConfidence = baseConfidence * energyMultiplier;
        
        // Add noise based on distance and energy
        const noiseLevel = 1 - finalConfidence;
        if (distance > 0 || observerEnergy < 100) {
            const energyNoise = (1 - energyMultiplier) * 0.3;
            const totalNoise = noiseLevel * 0.2 + energyNoise;
            field1 += (Math.random() - 0.5) * totalNoise;
            field2 += (Math.random() - 0.5) * totalNoise;
            field3 += (Math.random() - 0.5) * totalNoise;
            field4 += (Math.random() - 0.5) * totalNoise;
            field5 += (Math.random() - 0.5) * totalNoise;
        }
        
        return {
            field1: Math.max(0, Math.min(1, field1)),
            field2: Math.max(0, Math.min(1, field2)),
            field3: Math.max(0, Math.min(1, field3)),
            field4: Math.max(0, Math.min(1, field4)),
            field5: Math.max(0, Math.min(1, field5)),
            confidence: finalConfidence
        };
    }
    
    /**
     * Consume energy at a position (called by entities)
     */
    consumeEnergy(x, y) {
        const energyIndex = this.lowerDimension.energies.findIndex(
            energy => energy.x === x && energy.y === y && energy.active
        );
        
        if (energyIndex !== -1) {
            const energy = this.lowerDimension.energies[energyIndex];
            
            // Schedule core movement
            this.scheduleCoreMovement(energy.coreId, 3);
            
            // Remove energy
            this.lowerDimension.energies.splice(energyIndex, 1);
            return 10; // Energy value
        }
        
        return 0;
    }
    
    /**
     * Step the physics simulation forward
     */
    step() {
        this.shiftTemperature();
        
        if (this.phase === 'emit') {
            this.emitPhase();
            this.phase = 'collect';
        } else {
            this.collectPhase();
            this.phase = 'emit';
            this.tick++;
        }
        
        this.updateCores();
    }
    
    /**
     * Get current world state summary
     */
    getWorldState() {
        return {
            tick: this.tick,
            phase: this.phase,
            cores: this.lowerDimension.cores.length,
            energies: this.lowerDimension.energies.length,
            activeEnergies: this.lowerDimension.energies.filter(e => e.active).length,
            coreStates: {
                dormant: this.lowerDimension.cores.filter(c => c.state === 'dormant').length,
                incubated: this.lowerDimension.cores.filter(c => c.state === 'incubated').length,
                bloomed: this.lowerDimension.cores.filter(c => c.state === 'bloomed').length
            }
        };
    }
    
    /**
     * Reset the world to initial state
     */
    reset() {
        this.tick = 0;
        this.phase = 'emit';
        this.lowerDimension.temperature = this.generateTemperatureField();
        this.lowerDimension.catalyser = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
        this.lowerDimension.energies = [];
        this.upperDimension.catalyser = Array(this.gridSize).fill().map(() => 
            Array(this.gridSize).fill().map(() => Math.random() * 2)
        );
        this.initializeCores();
    }
}