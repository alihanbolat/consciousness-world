/**
 * Simple HTTP server for Consciousness World
 * Serves static files and handles CORS for module loading
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseManager } from './src/utils/DatabaseManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
let db;
try {
    db = new DatabaseManager();
    console.log('🗄️ Database initialized successfully');
} catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('⚠️ Running without database functionality');
}

// Middleware for JSON parsing with increased limits
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Request size monitoring and protection middleware
app.use((req, res, next) => {
    if (req.headers['content-length']) {
        const size = parseInt(req.headers['content-length']);
        if (size > 50 * 1024 * 1024) { // Block requests > 50MB
            console.error(`🚫 Blocked excessive request: ${req.path} - ${(size / 1024 / 1024).toFixed(2)}MB`);
            return res.status(413).json({ 
                error: 'Payload too large', 
                message: 'Request exceeds 50MB limit. Please optimize your data.',
                size: `${(size / 1024 / 1024).toFixed(2)}MB`
            });
        } else if (size > 10 * 1024 * 1024) { // Warn for requests > 10MB
            console.warn(`⚠️ Large request: ${req.path} - ${(size / 1024 / 1024).toFixed(2)}MB`);
        } else if (size > 1 * 1024 * 1024) { // Info for requests > 1MB
            console.info(`📦 Medium request: ${req.path} - ${(size / 1024 / 1024).toFixed(2)}MB`);
        }
    }
    next();
});

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Set proper MIME types for ES modules
app.use((req, res, next) => {
    if (req.url.endsWith('.js')) {
        res.type('application/javascript');
    }
    next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve src files for module imports
app.use('/src', express.static(path.join(__dirname, 'src')));

// Serve documentation
app.use('/docs', express.static(path.join(__dirname, 'docs')));

// API endpoint for server status
app.get('/api/status', (req, res) => {
    const dbStats = db ? db.getDatabaseStats() : null;
    res.json({
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: db ? 'connected' : 'disconnected',
        databaseStats: dbStats
    });
});

// ===== DATABASE API ENDPOINTS =====

// Session Management
app.post('/api/simulation/session/start', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    
    try {
        const { name, description, config } = req.body;
        const sessionId = db.startSession(name, description, config);
        res.json({ sessionId, message: 'Session started successfully' });
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ error: 'Failed to start session', details: error.message });
    }
});

app.post('/api/simulation/session/end', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    
    try {
        const { sessionId, totalTicks, totalEntities, peakFitness } = req.body;
        db.endSession(sessionId, totalTicks, totalEntities, peakFitness);
        res.json({ message: 'Session ended successfully' });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ error: 'Failed to end session', details: error.message });
    }
});

// Entity Lifecycle
app.post('/api/simulation/entity/birth', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    
    try {
        const { sessionId, entity, generation, tick, parentId } = req.body;
        db.recordEntityBirth(sessionId, entity, generation, tick, parentId);
        res.json({ message: 'Entity birth recorded' });
    } catch (error) {
        console.error('Error recording entity birth:', error);
        res.status(500).json({ error: 'Failed to record birth', details: error.message });
    }
});

app.post('/api/simulation/population/register-initial', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    
    try {
        const { sessionId, entities, generation, tick } = req.body;
        db.registerInitialPopulation(sessionId, entities, generation || 0, tick || 0);
        res.json({ message: `${entities.length} initial entities registered` });
    } catch (error) {
        console.error('Error registering initial population:', error);
        res.status(500).json({ error: 'Failed to register initial population', details: error.message });
    }
});

app.post('/api/simulation/entity/death', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    
    try {
        const { sessionId, entity, tick, causeOfDeath } = req.body;
        db.recordEntityDeath(sessionId, entity, tick, causeOfDeath);
        res.json({ message: 'Entity death recorded' });
    } catch (error) {
        console.error('Error recording entity death:', error);
        res.status(500).json({ error: 'Failed to record death', details: error.message });
    }
});

// Neural Network Storage
app.post('/api/simulation/neural-network', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    
    try {
        const { sessionId, entity, tick, generation } = req.body;
        db.storeNeuralNetwork(sessionId, entity, tick, generation);
        res.json({ message: 'Neural network stored' });
    } catch (error) {
        console.error('Error storing neural network:', error);
        res.status(500).json({ error: 'Failed to store neural network', details: error.message });
    }
});

// Entity Metrics (batch endpoint for performance)
app.post('/api/simulation/metrics/batch', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    
    try {
        const { sessionId, metrics } = req.body;
        
        // Process metrics in batches
        let processed = 0;
        metrics.forEach(metric => {
            const { entity, tick, action, reward } = metric;
            db.recordEntityMetrics(sessionId, entity, tick, action, reward);
            processed++;
        });
        
        res.json({ message: `${processed} metrics recorded` });
    } catch (error) {
        console.error('Error recording metrics batch:', error);
        res.status(500).json({ error: 'Failed to record metrics', details: error.message });
    }
});

// Population Statistics
app.post('/api/simulation/population-stats', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    
    try {
        const { sessionId, tick, stats, worldState } = req.body;
        db.recordPopulationStats(sessionId, tick, stats, worldState);
        res.json({ message: 'Population stats recorded' });
    } catch (error) {
        console.error('Error recording population stats:', error);
        res.status(500).json({ error: 'Failed to record population stats', details: error.message });
    }
});

// Evolution Events
app.post('/api/simulation/evolution-event', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    
    try {
        const { sessionId, tick, eventType, entityId, parentId, fitness, mutationData } = req.body;
        db.recordEvolutionEvent(sessionId, tick, eventType, entityId, parentId, fitness, mutationData);
        res.json({ message: 'Evolution event recorded' });
    } catch (error) {
        console.error('Error recording evolution event:', error);
        res.status(500).json({ error: 'Failed to record evolution event', details: error.message });
    }
});

// ===== ANALYSIS API ENDPOINTS =====

// Get population trends
app.get('/api/analysis/:sessionId/population-trends', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    
    try {
        const { sessionId } = req.params;
        const { startTick, endTick } = req.query;
        const trends = db.getPopulationTrends(sessionId, parseInt(startTick) || 0, endTick ? parseInt(endTick) : null);
        res.json({ trends });
    } catch (error) {
        console.error('Error getting population trends:', error);
        res.status(500).json({ error: 'Failed to get population trends', details: error.message });
    }
});

// Get top entities
app.get('/api/analysis/:sessionId/top-entities', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    
    try {
        const { sessionId } = req.params;
        const { limit } = req.query;
        const topEntities = db.getTopEntities(sessionId, parseInt(limit) || 10);
        res.json({ entities: topEntities });
    } catch (error) {
        console.error('Error getting top entities:', error);
        res.status(500).json({ error: 'Failed to get top entities', details: error.message });
    }
});

// Get entity evolution
app.get('/api/analysis/:sessionId/entity/:entityId/evolution', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    
    try {
        const { sessionId, entityId } = req.params;
        const evolution = db.getEntityEvolution(sessionId, entityId);
        res.json({ evolution });
    } catch (error) {
        console.error('Error getting entity evolution:', error);
        res.status(500).json({ error: 'Failed to get entity evolution', details: error.message });
    }
});

// Get entity lineage
app.get('/api/analysis/:sessionId/entity/:entityId/lineage', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    
    try {
        const { sessionId, entityId } = req.params;
        const { maxDepth } = req.query;
        const lineage = db.getEntityLineage(sessionId, entityId, parseInt(maxDepth) || 10);
        res.json({ lineage });
    } catch (error) {
        console.error('Error getting entity lineage:', error);
        res.status(500).json({ error: 'Failed to get entity lineage', details: error.message });
    }
});

// Get all sessions
app.get('/api/sessions', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    
    try {
        const sessions = db.db.prepare(`
            SELECT id, name, description, start_time, end_time, total_ticks, total_entities, peak_fitness
            FROM sessions 
            ORDER BY start_time DESC
        `).all();
        res.json({ sessions });
    } catch (error) {
        console.error('Error getting sessions:', error);
        res.status(500).json({ error: 'Failed to get sessions', details: error.message });
    }
});

// Export session data
app.get('/api/export/:sessionId', (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not available' });
    
    try {
        const { sessionId } = req.params;
        const { format } = req.query;
        
        const session = db.db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        const exportData = {
            session,
            entities: db.db.prepare(`SELECT * FROM entities WHERE session_id = ? ORDER BY birth_tick`).all(sessionId),
            populationStats: db.getPopulationTrends(sessionId),
            topEntities: db.getTopEntities(sessionId, 20),
            evolutionEvents: db.db.prepare(`SELECT * FROM evolution_events WHERE session_id = ? ORDER BY tick`).all(sessionId)
        };
        
        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="consciousness-${sessionId}.json"`);
            res.json(exportData);
        } else {
            res.json(exportData);
        }
    } catch (error) {
        console.error('Error exporting session:', error);
        res.status(500).json({ error: 'Failed to export session', details: error.message });
    }
});

// Handle 404s
app.use((req, res) => {
    res.status(404).send(`
        <h1>404 - Not Found</h1>
        <p>The requested resource was not found.</p>
        <a href="/">Return to Consciousness World</a>
    `);
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).send(`
        <h1>500 - Server Error</h1>
        <p>An error occurred while processing your request.</p>
        <a href="/">Return to Consciousness World</a>
    `);
});

// Start server
app.listen(PORT, () => {
    console.log(`🧠 Consciousness World server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'public')}`);
    console.log(`🔬 Source modules available at: /src/`);
    console.log(`📚 Documentation available at: /docs/`);
    
    if (process.env.NODE_ENV === 'development') {
        console.log('🐛 Development mode enabled');
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Consciousness World server...');
    process.exit(0);
});

export default app;