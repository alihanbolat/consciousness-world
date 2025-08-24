/**
 * Conscious Entity - Individual consciousness units in the simulation
 * 
 * Features:
 * - Neural network-based decision making
 * - Raw sensory field perception (5 field types)
 * - Experience memory with temporal awareness
 * - REINFORCE learning from immediate feedback
 * - Energy-based survival mechanics
 * - Spatial vision and navigation
 */

import { NeuralNetwork } from '../neural/NeuralNetwork.js';

export class ConsciousEntity {
    constructor(x = null, y = null, brain = null, gridSize = 100) {
        this.x = x ?? Math.floor(Math.random() * gridSize);
        this.y = y ?? Math.floor(Math.random() * gridSize);
        this.gridSize = gridSize;
        this.energy = 100;
        this.age = 0;
        this.totalEnergyGained = 0;
        this.fitness = 0;
        
        // Neural architecture
        const inputSize = 81 * 5 + 81 + 6 + 50; // vision(405) + confidence(81) + internal(6) + memory(50)
        const hiddenSizes = [256, 128, 64];
        const outputSize = 5; // up, down, left, right, stay
        
        this.brain = brain || new NeuralNetwork(inputSize, hiddenSizes, outputSize);
        
        // Sensory and memory systems
        this.vision = [];
        this.memory = [];
        this.memoryCapacity = 50;
        
        // Learning and experience tracking
        this.recentOutcomes = [];
        this.lastTotalEnergy = 0;
        this.lastAction = 'unknown';
        this.lastActionIndex = 4; // Default to 'stay'
        
        // Identity
        this.id = Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Update the entity's vision by scanning the environment
     * @param {WorldPhysics} world - The world physics engine
     */
    updateVision(world, otherEntities = []) {
        const visionRadius = 4;
        this.vision = [];
        
        for (let dx = -visionRadius; dx <= visionRadius; dx++) {
            for (let dy = -visionRadius; dy <= visionRadius; dy++) {
                const x = this.x + dx;
                const y = this.y + dy;
                const distance = Math.abs(dx) + Math.abs(dy);
                
                // Get base physical properties
                const properties = world.getRawPhysicalProperties(x, y, distance, this.energy);
                
                // Add life force detection (Field 5)
                properties.field5 = this.calculateLifeForce(x, y, otherEntities);
                
                this.vision.push({
                    relativeX: dx,
                    relativeY: dy,
                    distance: distance,
                    ...properties
                });
            }
        }
    }
    
    /**
     * Calculate life force field (Field 5) based on nearby entities
     */
    calculateLifeForce(x, y, otherEntities) {
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
            return 0;
        }
        
        const nearbyEntities = otherEntities.filter(entity => {
            if (!entity || entity.energy <= 0) return false;
            if (entity.x === this.x && entity.y === this.y) return false;
            
            const distance = Math.abs(entity.x - x) + Math.abs(entity.y - y);
            return distance <= 2;
        });
        
        if (nearbyEntities.length === 0) return 0;
        
        let field5 = Math.min(0.8, 0.2 * nearbyEntities.length);
        
        // Add influence based on other entities' energy and proximity
        let totalInfluence = 0;
        nearbyEntities.forEach(entity => {
            const distance = Math.abs(entity.x - x) + Math.abs(entity.y - y);
            const distanceWeight = 1.0 / (1 + distance * 0.5);
            const energyInfluence = entity.energy / 100.0;
            totalInfluence += energyInfluence * distanceWeight;
        });
        
        field5 += totalInfluence * 0.2;
        
        // Add temporal variation
        field5 += Math.sin((x * y + Date.now() * 0.001) * 0.1) * 0.05;
        
        return Math.max(0, Math.min(1, field5));
    }
    
    /**
     * Add an experience to memory
     */
    addMemory(observation, tick) {
        const memory = {
            tick: tick,
            x: this.x,
            y: this.y,
            field1: observation.field1,
            field2: observation.field2,
            field3: observation.field3,
            field4: observation.field4,
            field5: observation.field5,
            confidence: observation.confidence,
            energy: this.energy,
            action: observation.action || this.lastAction,
            outcome: observation.outcome || 'none',
            age: this.age
        };
        
        this.memory.push(memory);
        
        // Keep only recent memories
        if (this.memory.length > this.memoryCapacity) {
            this.memory.shift();
        }
    }
    
    /**
     * Get memory summary for neural network input
     */
    getMemorySummary() {
        const summary = new Array(50).fill(0);
        
        if (this.memory.length === 0) return summary;
        
        // Encode recent memories (last 5 memories)
        const recentMemories = this.memory.slice(-5);
        for (let i = 0; i < recentMemories.length; i++) {
            const mem = recentMemories[recentMemories.length - 1 - i];
            const baseIndex = i * 10;
            
            summary[baseIndex] = (Date.now() - mem.tick) / 1000.0; // Time since memory
            summary[baseIndex + 1] = Math.abs(this.x - mem.x) / this.gridSize; // Spatial distance
            summary[baseIndex + 2] = Math.abs(this.y - mem.y) / this.gridSize;
            summary[baseIndex + 3] = mem.field1;
            summary[baseIndex + 4] = mem.field2;
            summary[baseIndex + 5] = mem.field3;
            summary[baseIndex + 6] = mem.field4;
            summary[baseIndex + 7] = mem.field5;
            summary[baseIndex + 8] = mem.confidence;
            summary[baseIndex + 9] = mem.outcome === 'energy_gained' ? 1.0 : 
                                    mem.outcome === 'energy_lost' ? -1.0 : 0.0;
        }
        
        return summary;
    }
    
    /**
     * Create neural network input vector
     */
    getCellInput(tick) {
        const input = [];
        
        // Vision data (405 values: 81 positions × 5 fields)
        for (const visionPoint of this.vision) {
            input.push(visionPoint.field1 || 0);
            input.push(visionPoint.field2 || 0);
            input.push(visionPoint.field3 || 0);
            input.push(visionPoint.field4 || 0);
            input.push(visionPoint.field5 || 0);
        }
        
        // Confidence values (81 values)
        for (const visionPoint of this.vision) {
            input.push(visionPoint.confidence || 0);
        }
        
        // Internal state with harmonic time encoding (6 values)
        input.push(this.energy / 100.0); // Normalized energy
        input.push(this.x / this.gridSize); // Normalized position
        input.push(this.y / this.gridSize);
        
        // Cyclical time awareness
        const cyclePosition = (tick % 100) / 100.0;
        input.push(Math.sin(2 * Math.PI * cyclePosition));
        input.push(Math.cos(2 * Math.PI * cyclePosition));
        input.push(cyclePosition);
        
        // Memory summary (50 values)
        const memorySummary = this.getMemorySummary();
        input.push(...memorySummary);
        
        return input;
    }
    
    /**
     * Make a decision based on current state
     */
    makeDecision(tick) {
        const input = this.getCellInput(tick);
        const actionProbs = this.brain.forward(input);
        
        // Sample action from probability distribution
        const rand = Math.random();
        let cumProb = 0;
        
        for (let i = 0; i < actionProbs.length; i++) {
            cumProb += actionProbs[i];
            if (rand < cumProb) {
                return i; // 0=up, 1=down, 2=left, 3=right, 4=stay
            }
        }
        
        return 4; // Default: stay
    }
    
    /**
     * Execute an action (movement)
     */
    executeAction(action) {
        const moves = [
            {x: 0, y: -1}, // up
            {x: 0, y: 1},  // down  
            {x: -1, y: 0}, // left
            {x: 1, y: 0},  // right
            {x: 0, y: 0}   // stay
        ];
        
        const move = moves[action];
        // Toroidal world (wraparound)
        this.x = (this.x + move.x + this.gridSize) % this.gridSize;
        this.y = (this.y + move.y + this.gridSize) % this.gridSize;
        
        // Store action for memory and learning
        const actionNames = ['up', 'down', 'left', 'right', 'stay'];
        this.lastAction = actionNames[action];
        this.lastActionIndex = action;
    }
    
    /**
     * Apply REINFORCE learning based on recent outcomes
     */
    applyREINFORCELearning() {
        if (this.recentOutcomes.length === 0) return;
        
        const learningRate = 0.001;
        
        // Average recent rewards
        const avgReward = this.recentOutcomes.reduce((sum, outcome) => sum + outcome.reward, 0) / this.recentOutcomes.length;
        
        if (Math.abs(avgReward) < 0.01) return; // Skip if reward is negligible
        
        // Apply learning to the network
        const input = this.getCellInput(0); // Approximate input
        this.brain.applyREINFORCE(input, this.lastActionIndex, avgReward, learningRate);
    }
    
    /**
     * Update entity state (called each simulation step)
     */
    update(world, otherEntities, tick) {
        // Energy decay
        this.energy -= 0.5;
        this.age++;
        
        // Check for energy consumption
        const energyGained = world.consumeEnergy(this.x, this.y);
        if (energyGained > 0) {
            this.energy += energyGained;
            this.totalEnergyGained += energyGained;
            
            // Track positive outcome
            this.recentOutcomes.push({
                action: this.lastActionIndex,
                reward: 1.0,
                tick: tick
            });
        }
        
        // Track negative outcomes for low energy
        if (this.energy < 20) {
            this.recentOutcomes.push({
                action: this.lastActionIndex,
                reward: -0.1,
                tick: tick
            });
        }
        
        // Keep only recent outcomes (last 10 ticks)
        this.recentOutcomes = this.recentOutcomes.filter(outcome => tick - outcome.tick <= 10);
        
        // Update vision
        this.updateVision(world, otherEntities);
        
        // Record current observation in memory
        const currentObservation = this.vision.find(v => v.distance === 0);
        if (currentObservation) {
            const previousEnergy = this.energy + 0.5; // Energy before decay
            let outcome = 'moved';
            
            if (this.totalEnergyGained > this.lastTotalEnergy) {
                outcome = 'energy_gained';
            } else if (this.energy < previousEnergy - 0.5) {
                outcome = 'energy_lost';
            }
            
            this.addMemory({
                ...currentObservation,
                action: this.lastAction,
                outcome: outcome
            }, tick);
            
            this.lastTotalEnergy = this.totalEnergyGained;
        }
        
        // Make decision and execute action
        const action = this.makeDecision(tick);
        this.applyREINFORCELearning();
        this.executeAction(action);
        
        // Calculate fitness
        this.fitness = this.age + this.totalEnergyGained;
        
        return this.energy > 0; // Return false if dead
    }
    
    /**
     * Create a mutated offspring
     */
    reproduce(mutationRate = 0.1, mutationStrength = 0.1) {
        const child = new ConsciousEntity(null, null, null, this.gridSize);
        child.brain = this.brain.mutate(mutationRate, mutationStrength);
        return child;
    }
    
    /**
     * Create an exact copy
     */
    clone() {
        const copy = new ConsciousEntity(this.x, this.y, null, this.gridSize);
        copy.brain = this.brain.clone();
        copy.energy = this.energy;
        copy.age = this.age;
        copy.totalEnergyGained = this.totalEnergyGained;
        copy.fitness = this.fitness;
        return copy;
    }
    
    /**
     * Get entity status
     */
    getStatus() {
        return {
            id: this.id,
            position: { x: this.x, y: this.y },
            energy: this.energy,
            age: this.age,
            fitness: this.fitness,
            totalEnergyGained: this.totalEnergyGained,
            memorySize: this.memory.length,
            recentOutcomes: this.recentOutcomes.length,
            lastAction: this.lastAction
        };
    }
}