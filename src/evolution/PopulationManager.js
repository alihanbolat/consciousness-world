/**
 * Population Manager - Handles evolution and population dynamics
 * 
 * Features:
 * - Maintains a fixed population of conscious entities
 * - Fitness-based evolution when entities die
 * - Genetic algorithm with mutation
 * - Population statistics and tracking
 * - Generation management
 */

import { ConsciousEntity } from './ConsciousEntity.js';

export class PopulationManager {
    constructor(populationSize = 5, gridSize = 100) {
        this.populationSize = populationSize;
        this.gridSize = gridSize;
        this.entities = [];
        this.generation = 0;
        this.totalDeaths = 0;
        this.bestFitness = 0;
        this.allTimeBest = null;
        
        // Evolution parameters
        this.mutationRate = 0.1;
        this.mutationStrength = 0.1;
        
        // Statistics
        this.generationStats = [];
        
        // Initialize population
        this.initializePopulation();
    }
    
    /**
     * Create initial random population
     */
    initializePopulation() {
        this.entities = [];
        for (let i = 0; i < this.populationSize; i++) {
            this.entities.push(new ConsciousEntity(null, null, null, this.gridSize));
        }
    }
    
    /**
     * Update all entities in the population
     */
    update(world, tick, database = null, sessionId = null) {
        const livingEntities = this.entities.filter(entity => entity.energy > 0);
        
        // Update each entity
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            if (!entity || entity.energy <= 0) continue;
            
            const survived = entity.update(world, livingEntities, tick);
            
            // Database logging for entity metrics
            if (database && sessionId && survived) {
                database.recordEntityMetrics(sessionId, entity, tick, entity.lastAction);
                
                // Store recent memory if it exists
                if (entity.memory && entity.memory.length > 0) {
                    const recentMemory = entity.memory[entity.memory.length - 1];
                    database.storeEntityMemory(sessionId, entity, tick, recentMemory);
                }
            }
            
            if (!survived) {
                this.handleEntityDeath(i, database, sessionId, tick);
            }
        }
    }
    
    /**
     * Handle entity death and create replacement
     */
    handleEntityDeath(entityIndex, database = null, sessionId = null, tick = 0) {
        const deadEntity = this.entities[entityIndex];
        
        // Database logging for death
        if (database && sessionId) {
            database.recordEntityDeath(sessionId, deadEntity, tick, 'energy_depletion');
        }
        
        // Update statistics
        this.totalDeaths++;
        if (deadEntity.fitness > this.bestFitness) {
            this.bestFitness = deadEntity.fitness;
            this.allTimeBest = deadEntity.clone();
        }
        
        console.log(`Entity ${deadEntity.id} died! Age: ${deadEntity.age}, Energy gained: ${deadEntity.totalEnergyGained}, Fitness: ${deadEntity.fitness}`);
        
        // Find best living entity for breeding
        const bestParent = this.findBestLivingEntity();
        
        // Create new entity
        let newEntity;
        if (bestParent) {
            // Breed from best living entity
            newEntity = bestParent.reproduce(this.mutationRate, this.mutationStrength);
        } else {
            // No living entities - create random
            newEntity = new ConsciousEntity(null, null, null, this.gridSize);
        }
        
        // Database logging for birth
        if (database && sessionId) {
            database.recordEntityBirth(sessionId, newEntity, this.generation, tick, bestParent?.id);
            
            // Record mutation event
            if (bestParent) {
                database.recordEvolutionEvent(
                    sessionId, tick, 'mutation', newEntity.id, bestParent.id, null,
                    { mutationRate: this.mutationRate, mutationStrength: this.mutationStrength }
                );
            }
        }
        
        this.entities[entityIndex] = newEntity;
        this.generation++;
    }
    
    /**
     * Find the entity with highest fitness among living entities
     */
    findBestLivingEntity() {
        let bestEntity = null;
        let bestFitness = -1;
        
        for (const entity of this.entities) {
            if (entity && entity.energy > 0) {
                if (entity.fitness > bestFitness) {
                    bestFitness = entity.fitness;
                    bestEntity = entity;
                }
            }
        }
        
        return bestEntity;
    }
    
    /**
     * Get living entities
     */
    getLivingEntities() {
        return this.entities.filter(entity => entity && entity.energy > 0);
    }
    
    /**
     * Get population statistics
     */
    getPopulationStats() {
        const living = this.getLivingEntities();
        
        if (living.length === 0) {
            return {
                livingCount: 0,
                totalEnergy: 0,
                totalAge: 0,
                averageEnergy: 0,
                averageAge: 0,
                averageFitness: 0,
                bestCurrentFitness: 0,
                generation: this.generation,
                totalDeaths: this.totalDeaths,
                bestAllTimeFitness: this.bestFitness
            };
        }
        
        const totalEnergy = living.reduce((sum, entity) => sum + entity.energy, 0);
        const totalAge = living.reduce((sum, entity) => sum + entity.age, 0);
        const totalFitness = living.reduce((sum, entity) => sum + entity.fitness, 0);
        const bestCurrentFitness = Math.max(...living.map(entity => entity.fitness));
        
        return {
            livingCount: living.length,
            totalEnergy: Math.round(totalEnergy),
            totalAge: Math.round(totalAge),
            averageEnergy: Math.round(totalEnergy / living.length),
            averageAge: Math.round(totalAge / living.length),
            averageFitness: Math.round(totalFitness / living.length),
            bestCurrentFitness: Math.round(bestCurrentFitness),
            generation: this.generation,
            totalDeaths: this.totalDeaths,
            bestAllTimeFitness: Math.round(this.bestFitness)
        };
    }
    
    /**
     * Get detailed entity information
     */
    getEntityDetails() {
        return this.entities.map((entity, index) => ({
            index: index,
            alive: entity && entity.energy > 0,
            ...entity?.getStatus()
        }));
    }
    
    /**
     * Record generation statistics
     */
    recordGenerationStats(tick) {
        const stats = this.getPopulationStats();
        
        this.generationStats.push({
            tick: tick,
            generation: stats.generation,
            livingCount: stats.livingCount,
            averageEnergy: stats.averageEnergy,
            averageFitness: stats.averageFitness,
            bestFitness: stats.bestCurrentFitness
        });
        
        // Keep only recent statistics (last 100 generations)
        if (this.generationStats.length > 100) {
            this.generationStats.shift();
        }
    }
    
    /**
     * Get evolution trends
     */
    getEvolutionTrends() {
        if (this.generationStats.length < 2) {
            return {
                fitnessImprovement: 0,
                survivalRate: 0,
                populationStability: 0
            };
        }
        
        const recent = this.generationStats.slice(-10);
        const older = this.generationStats.slice(-20, -10);
        
        if (older.length === 0) return { fitnessImprovement: 0, survivalRate: 0, populationStability: 0 };
        
        const recentAvgFitness = recent.reduce((sum, stat) => sum + stat.averageFitness, 0) / recent.length;
        const olderAvgFitness = older.reduce((sum, stat) => sum + stat.averageFitness, 0) / older.length;
        
        const recentSurvival = recent.reduce((sum, stat) => sum + stat.livingCount, 0) / recent.length;
        const olderSurvival = older.reduce((sum, stat) => sum + stat.livingCount, 0) / older.length;
        
        return {
            fitnessImprovement: recentAvgFitness - olderAvgFitness,
            survivalRate: recentSurvival / this.populationSize,
            populationStability: Math.abs(recentSurvival - olderSurvival) < 1
        };
    }
    
    /**
     * Reset population to initial state
     */
    reset() {
        this.generation = 0;
        this.totalDeaths = 0;
        this.bestFitness = 0;
        this.allTimeBest = null;
        this.generationStats = [];
        this.initializePopulation();
    }
    
    /**
     * Set evolution parameters
     */
    setEvolutionParameters(mutationRate, mutationStrength) {
        this.mutationRate = mutationRate;
        this.mutationStrength = mutationStrength;
    }
    
    /**
     * Force evolution event (for testing/debugging)
     */
    forceEvolution() {
        if (this.entities.length === 0) return;
        
        // Kill weakest entity and replace with mutated best
        const livingEntities = this.getLivingEntities();
        if (livingEntities.length === 0) return;
        
        // Find weakest and strongest
        let weakestIndex = -1;
        let weakestFitness = Infinity;
        let strongest = null;
        let strongestFitness = -1;
        
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            if (!entity || entity.energy <= 0) continue;
            
            if (entity.fitness < weakestFitness) {
                weakestFitness = entity.fitness;
                weakestIndex = i;
            }
            
            if (entity.fitness > strongestFitness) {
                strongestFitness = entity.fitness;
                strongest = entity;
            }
        }
        
        if (weakestIndex !== -1 && strongest) {
            this.entities[weakestIndex] = strongest.reproduce(this.mutationRate, this.mutationStrength);
            console.log(`Forced evolution: Replaced weakest (fitness ${weakestFitness}) with offspring of strongest (fitness ${strongestFitness})`);
        }
    }
    
    /**
     * Export population state for analysis
     */
    exportPopulationState() {
        return {
            timestamp: Date.now(),
            populationSize: this.populationSize,
            generation: this.generation,
            totalDeaths: this.totalDeaths,
            bestFitness: this.bestFitness,
            entities: this.getEntityDetails(),
            stats: this.getPopulationStats(),
            trends: this.getEvolutionTrends(),
            generationHistory: this.generationStats.slice(-20) // Last 20 generations
        };
    }
}