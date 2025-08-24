/**
 * Database Manager - Comprehensive entity and evolution tracking
 * 
 * Features:
 * - Complete neural network storage and versioning
 * - Entity lifecycle tracking (birth, evolution, death)
 * - Performance metrics and behavioral analysis
 * - Memory and experience logging
 * - Population evolution trends
 * - Fitness landscape analysis
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export class DatabaseManager {
    constructor(dbPath = 'data/consciousness-evolution.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.isInitialized = false;
        
        // Ensure data directory exists
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        this.initialize();
    }
    
    /**
     * Initialize database connection and create tables
     */
    initialize() {
        try {
            this.db = new Database(this.dbPath);
            this.db.pragma('journal_mode = WAL'); // Better performance for concurrent access
            this.db.pragma('synchronous = NORMAL');
            this.db.pragma('cache_size = 10000');
            
            this.createTables();
            this.isInitialized = true;
            console.log(`🗄️ Database initialized: ${this.dbPath}`);
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }
    
    /**
     * Create all necessary database tables
     */
    createTables() {
        // Main entity tracking table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS entities (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                generation INTEGER NOT NULL,
                birth_tick INTEGER NOT NULL,
                death_tick INTEGER,
                parent_id TEXT,
                birth_x INTEGER NOT NULL,
                birth_y INTEGER NOT NULL,
                death_x INTEGER,
                death_y INTEGER,
                total_energy_gained REAL DEFAULT 0,
                max_energy REAL DEFAULT 100,
                age_at_death INTEGER,
                fitness REAL,
                cause_of_death TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Neural network snapshots
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS neural_networks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                tick INTEGER NOT NULL,
                generation INTEGER NOT NULL,
                network_data TEXT NOT NULL, -- JSON serialized network
                architecture_hash TEXT NOT NULL,
                total_parameters INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (entity_id) REFERENCES entities (id)
            );
        `);
        
        // Performance metrics per tick
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS entity_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                tick INTEGER NOT NULL,
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                energy REAL NOT NULL,
                age INTEGER NOT NULL,
                action TEXT NOT NULL,
                reward REAL,
                memory_count INTEGER NOT NULL,
                vision_confidence_avg REAL,
                field1_avg REAL,
                field2_avg REAL,
                field3_avg REAL,
                field4_avg REAL,
                field5_avg REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (entity_id) REFERENCES entities (id)
            );
        `);
        
        // Memory and experience tracking
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS entity_memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                memory_tick INTEGER NOT NULL,
                current_tick INTEGER NOT NULL,
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                field1 REAL NOT NULL,
                field2 REAL NOT NULL,
                field3 REAL NOT NULL,
                field4 REAL NOT NULL,
                field5 REAL NOT NULL,
                confidence REAL NOT NULL,
                action TEXT NOT NULL,
                outcome TEXT NOT NULL,
                energy_at_time REAL NOT NULL,
                age_at_time INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (entity_id) REFERENCES entities (id)
            );
        `);
        
        // Population-level statistics
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS population_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                tick INTEGER NOT NULL,
                generation INTEGER NOT NULL,
                living_count INTEGER NOT NULL,
                total_energy REAL NOT NULL,
                average_energy REAL NOT NULL,
                average_age REAL NOT NULL,
                average_fitness REAL NOT NULL,
                best_fitness REAL NOT NULL,
                total_deaths INTEGER NOT NULL,
                phase TEXT NOT NULL,
                active_energies INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Evolution events (births, deaths, mutations)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS evolution_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                tick INTEGER NOT NULL,
                event_type TEXT NOT NULL, -- 'birth', 'death', 'mutation'
                entity_id TEXT NOT NULL,
                parent_id TEXT,
                fitness REAL,
                mutation_rate REAL,
                mutation_strength REAL,
                event_data TEXT, -- JSON for additional data
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Sessions for organizing runs
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                config TEXT NOT NULL, -- JSON serialized configuration
                start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                end_time DATETIME,
                total_ticks INTEGER DEFAULT 0,
                total_entities INTEGER DEFAULT 0,
                peak_fitness REAL DEFAULT 0
            );
        `);
        
        // Create indexes for better query performance
        this.createIndexes();
    }
    
    /**
     * Create database indexes for performance
     */
    createIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_entities_session ON entities (session_id)',
            'CREATE INDEX IF NOT EXISTS idx_entities_generation ON entities (generation)',
            'CREATE INDEX IF NOT EXISTS idx_neural_networks_entity ON neural_networks (entity_id)',
            'CREATE INDEX IF NOT EXISTS idx_neural_networks_tick ON neural_networks (tick)',
            'CREATE INDEX IF NOT EXISTS idx_metrics_entity_tick ON entity_metrics (entity_id, tick)',
            'CREATE INDEX IF NOT EXISTS idx_memories_entity ON entity_memories (entity_id)',
            'CREATE INDEX IF NOT EXISTS idx_population_session_tick ON population_stats (session_id, tick)',
            'CREATE INDEX IF NOT EXISTS idx_evolution_session ON evolution_events (session_id)',
            'CREATE INDEX IF NOT EXISTS idx_evolution_tick ON evolution_events (tick)'
        ];
        
        indexes.forEach(indexSQL => {
            this.db.exec(indexSQL);
        });
    }
    
    /**
     * Start a new session
     */
    startSession(name, description, config) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const stmt = this.db.prepare(`
            INSERT INTO sessions (id, name, description, config)
            VALUES (?, ?, ?, ?)
        `);
        
        stmt.run(sessionId, name, description, JSON.stringify(config));
        
        console.log(`🆔 New session started: ${sessionId}`);
        return sessionId;
    }
    
    /**
     * End a session
     */
    endSession(sessionId, totalTicks, totalEntities, peakFitness) {
        const stmt = this.db.prepare(`
            UPDATE sessions 
            SET end_time = CURRENT_TIMESTAMP, 
                total_ticks = ?, 
                total_entities = ?, 
                peak_fitness = ?
            WHERE id = ?
        `);
        
        stmt.run(totalTicks, totalEntities, peakFitness, sessionId);
    }
    
    /**
     * Record entity birth
     */
    recordEntityBirth(sessionId, entity, generation, tick, parentId = null) {
        const stmt = this.db.prepare(`
            INSERT INTO entities (
                id, session_id, generation, birth_tick, parent_id, 
                birth_x, birth_y, max_energy
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            entity.id,
            sessionId,
            generation,
            tick,
            parentId,
            entity.x,
            entity.y,
            entity.energy
        );
        
        // Record birth event
        this.recordEvolutionEvent(sessionId, tick, 'birth', entity.id, parentId);
    }
    
    /**
     * Record entity death
     */
    recordEntityDeath(sessionId, entity, tick, causeOfDeath = 'energy_depletion') {
        const stmt = this.db.prepare(`
            UPDATE entities 
            SET death_tick = ?, 
                death_x = ?, 
                death_y = ?, 
                total_energy_gained = ?,
                age_at_death = ?,
                fitness = ?,
                cause_of_death = ?
            WHERE id = ? AND session_id = ?
        `);
        
        stmt.run(
            tick,
            entity.x,
            entity.y,
            entity.totalEnergyGained,
            entity.age,
            entity.fitness,
            causeOfDeath,
            entity.id,
            sessionId
        );
        
        // Record death event
        this.recordEvolutionEvent(sessionId, tick, 'death', entity.id, null, entity.fitness);
    }
    
    /**
     * Store neural network snapshot
     */
    storeNeuralNetwork(sessionId, entity, tick, generation) {
        const networkData = this.serializeNeuralNetwork(entity.brain);
        const architecture = entity.brain.getArchitecture();
        const architectureHash = this.hashString(JSON.stringify(architecture.structure));
        
        const stmt = this.db.prepare(`
            INSERT INTO neural_networks (
                entity_id, session_id, tick, generation,
                network_data, architecture_hash, total_parameters
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            entity.id,
            sessionId,
            tick,
            generation,
            networkData,
            architectureHash,
            architecture.totalParameters
        );
    }
    
    /**
     * Record entity metrics for a tick
     */
    recordEntityMetrics(sessionId, entity, tick, action, reward = null) {
        // Calculate vision averages
        let visionConfidenceSum = 0;
        let field1Sum = 0, field2Sum = 0, field3Sum = 0, field4Sum = 0, field5Sum = 0;
        
        if (entity.vision && entity.vision.length > 0) {
            entity.vision.forEach(v => {
                visionConfidenceSum += v.confidence || 0;
                field1Sum += v.field1 || 0;
                field2Sum += v.field2 || 0;
                field3Sum += v.field3 || 0;
                field4Sum += v.field4 || 0;
                field5Sum += v.field5 || 0;
            });
            
            const visionCount = entity.vision.length;
            visionConfidenceSum /= visionCount;
            field1Sum /= visionCount;
            field2Sum /= visionCount;
            field3Sum /= visionCount;
            field4Sum /= visionCount;
            field5Sum /= visionCount;
        }
        
        const stmt = this.db.prepare(`
            INSERT INTO entity_metrics (
                entity_id, session_id, tick, x, y, energy, age, action, reward,
                memory_count, vision_confidence_avg, field1_avg, field2_avg, 
                field3_avg, field4_avg, field5_avg
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            entity.id,
            sessionId,
            tick,
            entity.x,
            entity.y,
            entity.energy,
            entity.age,
            action,
            reward,
            entity.memory ? entity.memory.length : 0,
            visionConfidenceSum,
            field1Sum,
            field2Sum,
            field3Sum,
            field4Sum,
            field5Sum
        );
    }
    
    /**
     * Store entity memory
     */
    storeEntityMemory(sessionId, entity, tick, memory) {
        const stmt = this.db.prepare(`
            INSERT INTO entity_memories (
                entity_id, session_id, memory_tick, current_tick, x, y,
                field1, field2, field3, field4, field5, confidence,
                action, outcome, energy_at_time, age_at_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            entity.id,
            sessionId,
            memory.tick,
            tick,
            memory.x,
            memory.y,
            memory.field1,
            memory.field2,
            memory.field3,
            memory.field4,
            memory.field5,
            memory.confidence,
            memory.action,
            memory.outcome,
            memory.energy,
            memory.age
        );
    }
    
    /**
     * Record population statistics
     */
    recordPopulationStats(sessionId, tick, stats, worldState) {
        const stmt = this.db.prepare(`
            INSERT INTO population_stats (
                session_id, tick, generation, living_count, total_energy,
                average_energy, average_age, average_fitness, best_fitness,
                total_deaths, phase, active_energies
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            sessionId,
            tick,
            stats.generation,
            stats.livingCount,
            stats.totalEnergy,
            stats.averageEnergy,
            stats.totalAge / Math.max(stats.livingCount, 1),
            stats.averageFitness,
            stats.bestAllTimeFitness,
            stats.totalDeaths,
            worldState.phase,
            worldState.activeEnergies
        );
    }
    
    /**
     * Record evolution events
     */
    recordEvolutionEvent(sessionId, tick, eventType, entityId, parentId = null, fitness = null, mutationData = null) {
        const stmt = this.db.prepare(`
            INSERT INTO evolution_events (
                session_id, tick, event_type, entity_id, parent_id, fitness,
                mutation_rate, mutation_strength, event_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const mutationRate = mutationData?.mutationRate || null;
        const mutationStrength = mutationData?.mutationStrength || null;
        const eventDataJson = mutationData ? JSON.stringify(mutationData) : null;
        
        stmt.run(
            sessionId,
            tick,
            eventType,
            entityId,
            parentId,
            fitness,
            mutationRate,
            mutationStrength,
            eventDataJson
        );
    }
    
    /**
     * Serialize neural network to JSON
     */
    serializeNeuralNetwork(network) {
        const networkData = {
            layers: network.layers.map(layer => ({
                weights: layer.weights,
                biases: layer.biases
            })),
            architecture: network.getArchitecture(),
            serializedAt: Date.now()
        };
        
        return JSON.stringify(networkData);
    }
    
    /**
     * Deserialize neural network from JSON
     */
    deserializeNeuralNetwork(networkDataJson, NetworkClass) {
        const data = JSON.parse(networkDataJson);
        
        // Create a dummy network with correct architecture
        const architecture = data.architecture;
        const inputSize = architecture.structure[0].inputs;
        const outputSize = architecture.structure[architecture.structure.length - 1].neurons;
        const hiddenSizes = architecture.structure.slice(0, -1).map(layer => layer.neurons);
        
        const network = new NetworkClass(inputSize, hiddenSizes, outputSize);
        
        // Replace with stored weights and biases
        data.layers.forEach((layerData, index) => {
            network.layers[index].weights = layerData.weights;
            network.layers[index].biases = layerData.biases;
        });
        
        return network;
    }
    
    /**
     * Simple string hash function
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    
    /**
     * Get entity evolution history
     */
    getEntityEvolution(sessionId, entityId) {
        const stmt = this.db.prepare(`
            SELECT nn.*, e.generation, e.birth_tick, e.death_tick
            FROM neural_networks nn
            JOIN entities e ON nn.entity_id = e.id
            WHERE nn.session_id = ? AND nn.entity_id = ?
            ORDER BY nn.tick ASC
        `);
        
        return stmt.all(sessionId, entityId);
    }
    
    /**
     * Get population fitness trends
     */
    getPopulationTrends(sessionId, startTick = 0, endTick = null) {
        const sql = endTick 
            ? `SELECT * FROM population_stats WHERE session_id = ? AND tick >= ? AND tick <= ? ORDER BY tick`
            : `SELECT * FROM population_stats WHERE session_id = ? AND tick >= ? ORDER BY tick`;
            
        const stmt = this.db.prepare(sql);
        return endTick ? stmt.all(sessionId, startTick, endTick) : stmt.all(sessionId, startTick);
    }
    
    /**
     * Get top performing entities
     */
    getTopEntities(sessionId, limit = 10) {
        const stmt = this.db.prepare(`
            SELECT * FROM entities 
            WHERE session_id = ? AND fitness IS NOT NULL
            ORDER BY fitness DESC 
            LIMIT ?
        `);
        
        return stmt.all(sessionId, limit);
    }
    
    /**
     * Get entity lineage (parent-child relationships)
     */
    getEntityLineage(sessionId, entityId, maxDepth = 10) {
        const stmt = this.db.prepare(`
            WITH RECURSIVE lineage(id, parent_id, generation, depth) AS (
                SELECT id, parent_id, generation, 0
                FROM entities 
                WHERE id = ? AND session_id = ?
                
                UNION ALL
                
                SELECT e.id, e.parent_id, e.generation, l.depth + 1
                FROM entities e
                JOIN lineage l ON e.parent_id = l.id
                WHERE l.depth < ? AND e.session_id = ?
            )
            SELECT e.*, l.depth
            FROM lineage l
            JOIN entities e ON l.id = e.id
            ORDER BY l.depth, e.generation
        `);
        
        return stmt.all(entityId, sessionId, maxDepth, sessionId);
    }
    
    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            console.log('🗄️ Database connection closed');
        }
    }
    
    /**
     * Get database statistics
     */
    getDatabaseStats() {
        const stats = {
            sessions: this.db.prepare('SELECT COUNT(*) as count FROM sessions').get().count,
            entities: this.db.prepare('SELECT COUNT(*) as count FROM entities').get().count,
            networks: this.db.prepare('SELECT COUNT(*) as count FROM neural_networks').get().count,
            metrics: this.db.prepare('SELECT COUNT(*) as count FROM entity_metrics').get().count,
            memories: this.db.prepare('SELECT COUNT(*) as count FROM entity_memories').get().count,
            events: this.db.prepare('SELECT COUNT(*) as count FROM evolution_events').get().count
        };
        
        return stats;
    }
}