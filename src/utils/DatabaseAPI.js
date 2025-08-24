/**
 * Database API Client for Browser-side Simulation
 * 
 * Handles communication between the browser simulation and the backend database
 * through REST API endpoints. Provides batching and error handling for performance.
 */

export class DatabaseAPI {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.currentSessionId = null;
        this.metricsBatch = [];
        this.batchSize = 10; // Further reduced batch size to prevent large payloads
        this.flushInterval = 2000; // 2 seconds - even more frequent flushing
        this.isEnabled = true;
        this.enableNeuralNetworks = false; // Disable neural network storage by default
        
        // Start automatic batch flushing
        this.startBatchFlushing();
        
        console.log('🔌 Database API client initialized');
    }
    
    /**
     * Check if database is available
     */
    async checkStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/api/status`);
            const status = await response.json();
            this.isEnabled = status.database === 'connected';
            return status;
        } catch (error) {
            console.warn('Database API not available:', error.message);
            this.isEnabled = false;
            return { database: 'disconnected', error: error.message };
        }
    }
    
    /**
     * Start a new simulation session
     */
    async startSession(name, description, config) {
        if (!this.isEnabled) return null;
        
        try {
            const response = await fetch(`${this.baseUrl}/api/simulation/session/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, config })
            });
            
            const result = await response.json();
            if (response.ok) {
                this.currentSessionId = result.sessionId;
                console.log(`📊 Session started: ${this.currentSessionId}`);
                return result.sessionId;
            } else {
                console.error('Failed to start session:', result.error);
                return null;
            }
        } catch (error) {
            console.error('Error starting session:', error);
            return null;
        }
    }
    
    /**
     * End the current simulation session
     */
    async endSession(totalTicks, totalEntities, peakFitness) {
        if (!this.isEnabled || !this.currentSessionId) return;
        
        // Flush any remaining metrics
        await this.flushMetricsBatch();
        
        try {
            const response = await fetch(`${this.baseUrl}/api/simulation/session/end`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.currentSessionId,
                    totalTicks,
                    totalEntities,
                    peakFitness
                })
            });
            
            if (response.ok) {
                console.log(`📊 Session ended: ${this.currentSessionId}`);
                this.currentSessionId = null;
            }
        } catch (error) {
            console.error('Error ending session:', error);
        }
    }
    
    /**
     * Register initial population entities with optimized data
     */
    async registerInitialPopulation(entities, generation = 0, tick = 0) {
        if (!this.isEnabled || !this.currentSessionId) return;
        
        try {
            // Optimize entities to reduce payload size
            const optimizedEntities = entities.map(entity => ({
                id: entity.id,
                x: entity.x || 0,
                y: entity.y || 0,
                energy: Math.round((entity.energy || 0) * 100) / 100,
                age: entity.age || 0,
                fitness: entity.fitness ? Math.round(entity.fitness * 100) / 100 : 0,
                totalEnergyGained: entity.totalEnergyGained || 0,
                // Don't include vision array for initial registration - it's not needed
                // Vision will be recorded during metrics batches instead
            }));
            
            const payload = JSON.stringify({
                sessionId: this.currentSessionId,
                entities: optimizedEntities,
                generation,
                tick
            });
            
            // Monitor payload size
            const payloadSizeMB = payload.length / 1024 / 1024;
            if (payloadSizeMB > 1) {
                console.warn(`Large initial population payload: ${payloadSizeMB.toFixed(2)}MB for ${entities.length} entities`);
            }
            
            await fetch(`${this.baseUrl}/api/simulation/population/register-initial`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload
            });
            
            console.log(`📊 Registered ${entities.length} initial entities (${payloadSizeMB.toFixed(3)}MB)`);
        } catch (error) {
            console.warn('Error registering initial population:', error.message);
        }
    }
    
    /**
     * Record entity birth
     */
    async recordEntityBirth(entity, generation, tick, parentId = null) {
        if (!this.isEnabled || !this.currentSessionId) return;
        
        try {
            await fetch(`${this.baseUrl}/api/simulation/entity/birth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.currentSessionId,
                    entity,
                    generation,
                    tick,
                    parentId
                })
            });
        } catch (error) {
            console.warn('Error recording entity birth:', error.message);
        }
    }
    
    /**
     * Record entity death
     */
    async recordEntityDeath(entity, tick, causeOfDeath = 'energy_depletion') {
        if (!this.isEnabled || !this.currentSessionId) return;
        
        try {
            await fetch(`${this.baseUrl}/api/simulation/entity/death`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.currentSessionId,
                    entity,
                    tick,
                    causeOfDeath
                })
            });
        } catch (error) {
            console.warn('Error recording entity death:', error.message);
        }
    }
    
    /**
     * Store neural network snapshot with size limiting
     */
    async storeNeuralNetwork(entity, tick, generation) {
        if (!this.isEnabled || !this.currentSessionId || !this.enableNeuralNetworks) {
            if (!this.enableNeuralNetworks) {
                console.log('Neural network storage disabled - skipping');
            }
            return;
        }
        
        try {
            const payload = JSON.stringify({
                sessionId: this.currentSessionId,
                entity,
                tick,
                generation
            });
            
            // Skip if payload is too large (>5MB)
            if (payload.length > 5 * 1024 * 1024) {
                console.warn(`Skipping neural network storage - payload too large: ${(payload.length / 1024 / 1024).toFixed(2)}MB`);
                return;
            }
            
            await fetch(`${this.baseUrl}/api/simulation/neural-network`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload
            });
        } catch (error) {
            console.warn('Error storing neural network:', error.message);
        }
    }
    
    /**
     * Add entity metrics to batch (for performance) with entity data optimization
     */
    recordEntityMetrics(entity, tick, action, reward = null) {
        if (!this.isEnabled || !this.currentSessionId) return;
        
        // Optimize entity data to reduce payload size
        const optimizedEntity = {
            id: entity.id,
            x: entity.x || 0,
            y: entity.y || 0,
            energy: Math.round((entity.energy || 0) * 100) / 100, // 2 decimal precision
            age: entity.age || 0,
            fitness: entity.fitness ? Math.round(entity.fitness * 100) / 100 : 0,
            // Only include essential vision data if it exists, and limit it
            vision: entity.vision ? entity.vision.slice(0, 5).map(v => ({
                confidence: Math.round((v.confidence || 0) * 100) / 100,
                field1: Math.round((v.field1 || 0) * 100) / 100,
                field2: Math.round((v.field2 || 0) * 100) / 100,
                field3: Math.round((v.field3 || 0) * 100) / 100,
                field4: Math.round((v.field4 || 0) * 100) / 100,
                field5: Math.round((v.field5 || 0) * 100) / 100
            })) : []
        };
        
        this.metricsBatch.push({
            entity: optimizedEntity,
            tick,
            action,
            reward: reward ? Math.round(reward * 100) / 100 : null
        });
        
        // Auto-flush if batch is getting large (reduced threshold)
        if (this.metricsBatch.length >= this.batchSize) {
            this.flushMetricsBatch();
        }
    }
    
    /**
     * Flush metrics batch to server with chunking for large payloads
     */
    async flushMetricsBatch() {
        if (!this.isEnabled || !this.currentSessionId || this.metricsBatch.length === 0) return;
        
        const batch = [...this.metricsBatch];
        this.metricsBatch = [];
        
        // Split into very small chunks to avoid payload size limits
        const chunkSize = 5; // Very small chunks to minimize payload size
        const chunks = [];
        
        for (let i = 0; i < batch.length; i += chunkSize) {
            chunks.push(batch.slice(i, i + chunkSize));
        }
        
        // Send chunks sequentially to avoid overwhelming the server
        for (const chunk of chunks) {
            try {
                const payload = JSON.stringify({
                    sessionId: this.currentSessionId,
                    metrics: chunk
                });
                
                // Monitor payload size
                const payloadSizeMB = payload.length / 1024 / 1024;
                if (payloadSizeMB > 1) {
                    console.warn(`Large metrics payload: ${payloadSizeMB.toFixed(2)}MB for ${chunk.length} metrics`);
                }
                
                await fetch(`${this.baseUrl}/api/simulation/metrics/batch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload
                });
            } catch (error) {
                console.warn('Error flushing metrics chunk:', error.message);
                // Re-add failed chunk to batch for retry
                this.metricsBatch.unshift(...chunk.slice(0, Math.max(0, this.batchSize - this.metricsBatch.length)));
            }
        }
    }
    
    /**
     * Record population statistics
     */
    async recordPopulationStats(tick, stats, worldState) {
        if (!this.isEnabled || !this.currentSessionId) return;
        
        try {
            await fetch(`${this.baseUrl}/api/simulation/population-stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.currentSessionId,
                    tick,
                    stats,
                    worldState
                })
            });
        } catch (error) {
            console.warn('Error recording population stats:', error.message);
        }
    }
    
    /**
     * Record evolution event
     */
    async recordEvolutionEvent(tick, eventType, entityId, parentId = null, fitness = null, mutationData = null) {
        if (!this.isEnabled || !this.currentSessionId) return;
        
        try {
            await fetch(`${this.baseUrl}/api/simulation/evolution-event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.currentSessionId,
                    tick,
                    eventType,
                    entityId,
                    parentId,
                    fitness,
                    mutationData
                })
            });
        } catch (error) {
            console.warn('Error recording evolution event:', error.message);
        }
    }
    
    /**
     * Start automatic batch flushing
     */
    startBatchFlushing() {
        setInterval(() => {
            if (this.metricsBatch.length > 0) {
                this.flushMetricsBatch();
            }
        }, this.flushInterval);
    }
    
    // ===== ANALYSIS METHODS =====
    
    /**
     * Get population trends for current session
     */
    async getPopulationTrends(startTick = 0, endTick = null) {
        if (!this.isEnabled || !this.currentSessionId) return [];
        
        try {
            const params = new URLSearchParams({ startTick: startTick.toString() });
            if (endTick) params.append('endTick', endTick.toString());
            
            const response = await fetch(`${this.baseUrl}/api/analysis/${this.currentSessionId}/population-trends?${params}`);
            const result = await response.json();
            return result.trends || [];
        } catch (error) {
            console.error('Error getting population trends:', error);
            return [];
        }
    }
    
    /**
     * Get top performing entities
     */
    async getTopEntities(limit = 10) {
        if (!this.isEnabled || !this.currentSessionId) return [];
        
        try {
            const response = await fetch(`${this.baseUrl}/api/analysis/${this.currentSessionId}/top-entities?limit=${limit}`);
            const result = await response.json();
            return result.entities || [];
        } catch (error) {
            console.error('Error getting top entities:', error);
            return [];
        }
    }
    
    /**
     * Get all sessions
     */
    async getSessions() {
        if (!this.isEnabled) return [];
        
        try {
            const response = await fetch(`${this.baseUrl}/api/sessions`);
            const result = await response.json();
            return result.sessions || [];
        } catch (error) {
            console.error('Error getting sessions:', error);
            return [];
        }
    }
    
    /**
     * Export current session data
     */
    async exportCurrentSession(format = 'json') {
        if (!this.isEnabled || !this.currentSessionId) return null;
        
        try {
            const response = await fetch(`${this.baseUrl}/api/export/${this.currentSessionId}?format=${format}`);
            return await response.json();
        } catch (error) {
            console.error('Error exporting session:', error);
            return null;
        }
    }
}

// Create global instance
export const dbAPI = new DatabaseAPI();