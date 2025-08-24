/**
 * Simple HTTP server for Consciousness World
 * Serves static files and handles CORS for module loading
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

// API endpoint for simulation data (future expansion)
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
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