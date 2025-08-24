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
    enableDatabase: true, // Enable database logging
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
        
        // Setup database UI
        setupDatabaseUI();
        
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

/**
 * Setup database UI components and handlers
 */
function setupDatabaseUI() {
    // Update database status
    updateDatabaseStatus();
    
    // Setup periodic database stats updates
    setInterval(updateDatabaseStats, 5000); // Update every 5 seconds
    
    // Make database functions available globally for HTML onclick handlers
    window.toggleDatabase = toggleDatabase;
    window.openDatabaseAnalysis = openDatabaseAnalysis;
    window.exportDatabaseData = exportDatabaseData;
}

/**
 * Update database status display
 */
function updateDatabaseStatus() {
    const statusText = document.getElementById('dbStatusText');
    const sessionInfo = document.getElementById('dbSessionInfo');
    
    if (simulation && simulation.database) {
        statusText.textContent = '✅ Connected';
        statusText.style.color = '#4ade80';
        
        if (simulation.currentSessionId) {
            sessionInfo.textContent = `Session: ${simulation.currentSessionId.substring(0, 20)}...`;
        } else {
            sessionInfo.textContent = 'No active session';
        }
    } else {
        statusText.textContent = '❌ Disabled';
        statusText.style.color = '#ef4444';
        sessionInfo.textContent = 'Database logging is disabled';
    }
}

/**
 * Update database statistics
 */
function updateDatabaseStats() {
    if (!simulation || !simulation.database) return;
    
    try {
        const stats = simulation.database.getDatabaseStats();
        const statsContent = document.getElementById('dbStatsContent');
        
        if (statsContent) {
            statsContent.innerHTML = `
                <div>Sessions: ${stats.sessions}</div>
                <div>Entities: ${stats.entities}</div>
                <div>Neural Networks: ${stats.networks}</div>
                <div>Metrics: ${stats.metrics}</div>
                <div>Memories: ${stats.memories}</div>
                <div>Evolution Events: ${stats.events}</div>
            `;
        }
    } catch (error) {
        console.warn('Failed to update database stats:', error);
    }
}

/**
 * Toggle database logging
 */
function toggleDatabase(enabled) {
    if (!simulation) return;
    
    // Note: This doesn't actually enable/disable the database connection
    // since that's initialized at startup. This is more for future enhancement
    // where database could be toggled at runtime.
    
    if (enabled && !simulation.database) {
        simulation.ui.showNotification('Database must be enabled at startup', 'warning');
        document.getElementById('enableDatabase').checked = false;
        return;
    }
    
    simulation.ui.showNotification(
        `Database logging ${enabled ? 'enabled' : 'disabled'}`, 
        'info'
    );
    
    updateDatabaseStatus();
}

/**
 * Open database analysis window
 */
function openDatabaseAnalysis() {
    if (!simulation || !simulation.database) {
        simulation.ui.showNotification('Database not available', 'warning');
        return;
    }
    
    // Create a popup window for database analysis
    const popup = window.open('', 'DatabaseAnalysis', 'width=1000,height=700,scrollbars=yes,resizable=yes');
    
    if (!popup) {
        simulation.ui.showNotification('Popup blocked. Please allow popups for database analysis.', 'warning');
        return;
    }
    
    // Generate database analysis HTML
    generateDatabaseAnalysisHTML(popup);
}

/**
 * Generate database analysis HTML for popup
 */
async function generateDatabaseAnalysisHTML(popup) {
    try {
        const stats = simulation.database.getDatabaseStats();
        const currentSessionId = simulation.currentSessionId;
        
        // Get recent data for current session
        let recentEntities = [];
        let populationTrends = [];
        
        if (currentSessionId) {
            try {
                recentEntities = simulation.database.getTopEntities(currentSessionId, 5);
                populationTrends = simulation.database.getPopulationTrends(currentSessionId);
            } catch (error) {
                console.warn('Error fetching session data:', error);
            }
        }
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Consciousness Database Analysis</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px; 
                        background: #1a1a1a; 
                        color: white; 
                    }
                    .section { 
                        background: #2a2a2a; 
                        padding: 15px; 
                        margin: 15px 0; 
                        border-radius: 8px; 
                        border: 1px solid #333;
                    }
                    .stats-grid { 
                        display: grid; 
                        grid-template-columns: repeat(3, 1fr); 
                        gap: 10px; 
                        margin: 10px 0; 
                    }
                    .stat-item { 
                        background: #333; 
                        padding: 10px; 
                        border-radius: 4px; 
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 10px 0; 
                    }
                    th, td { 
                        border: 1px solid #444; 
                        padding: 8px; 
                        text-align: left; 
                    }
                    th { 
                        background: #333; 
                    }
                    .info { color: #4ade80; }
                    .warning { color: #f59e0b; }
                    .error { color: #ef4444; }
                    button {
                        background: #4ade80;
                        color: black;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 5px;
                    }
                    button:hover { background: #22c55e; }
                </style>
            </head>
            <body>
                <h1>🧠 Consciousness Database Analysis</h1>
                
                <div class="section">
                    <h2>📊 Database Statistics</h2>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <strong>Sessions</strong><br>
                            ${stats.sessions}
                        </div>
                        <div class="stat-item">
                            <strong>Entities</strong><br>
                            ${stats.entities}
                        </div>
                        <div class="stat-item">
                            <strong>Neural Networks</strong><br>
                            ${stats.networks}
                        </div>
                        <div class="stat-item">
                            <strong>Metrics Records</strong><br>
                            ${stats.metrics}
                        </div>
                        <div class="stat-item">
                            <strong>Memory Records</strong><br>
                            ${stats.memories}
                        </div>
                        <div class="stat-item">
                            <strong>Evolution Events</strong><br>
                            ${stats.events}
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>🎯 Current Session</h2>
                    ${currentSessionId ? `
                        <p><strong>Session ID:</strong> ${currentSessionId}</p>
                        <p><strong>Status:</strong> <span class="info">Active</span></p>
                        
                        <h3>🏆 Top Entities in Current Session</h3>
                        ${recentEntities.length > 0 ? `
                            <table>
                                <tr>
                                    <th>Entity ID</th>
                                    <th>Fitness</th>
                                    <th>Age</th>
                                    <th>Energy Gained</th>
                                </tr>
                                ${recentEntities.map(entity => `
                                    <tr>
                                        <td>${entity.id.substring(0, 12)}...</td>
                                        <td>${entity.fitness?.toFixed(1) || 'N/A'}</td>
                                        <td>${entity.age_at_death || 'Alive'}</td>
                                        <td>${entity.total_energy_gained || 0}</td>
                                    </tr>
                                `).join('')}
                            </table>
                        ` : '<p>No entities with fitness data yet.</p>'}
                        
                        <h3>📈 Population Trends</h3>
                        ${populationTrends.length > 0 ? `
                            <p><strong>Data Points:</strong> ${populationTrends.length}</p>
                            <p><strong>Peak Fitness:</strong> ${Math.max(...populationTrends.map(t => t.best_fitness)).toFixed(1)}</p>
                            <p><strong>Current Generation:</strong> ${populationTrends[populationTrends.length - 1]?.generation || 0}</p>
                        ` : '<p>No population data collected yet.</p>'}
                    ` : `
                        <p class="warning">No active session. Start the simulation to begin data collection.</p>
                    `}
                </div>

                <div class="section">
                    <h2>🛠️ Analysis Tools</h2>
                    <p>For comprehensive analysis, use the command-line tools:</p>
                    <div style="background: #333; padding: 10px; border-radius: 4px; font-family: monospace;">
                        <div>npm run db:query</div>
                        <div>npm run db:export</div>
                    </div>
                    <p>These tools provide advanced querying, neural network analysis, and data export capabilities.</p>
                    
                    <button onclick="window.close()">Close Window</button>
                    <button onclick="location.reload()">Refresh Data</button>
                </div>
            </body>
            </html>
        `;
        
        popup.document.write(html);
        popup.document.close();
        
    } catch (error) {
        popup.document.write(`
            <html>
            <body style="font-family: Arial; padding: 20px; background: #1a1a1a; color: white;">
                <h1>❌ Database Analysis Error</h1>
                <p>Failed to load database analysis: ${error.message}</p>
                <button onclick="window.close()">Close</button>
            </body>
            </html>
        `);
        popup.document.close();
    }
}

/**
 * Export database data
 */
function exportDatabaseData() {
    if (!simulation || !simulation.database || !simulation.currentSessionId) {
        simulation.ui.showNotification('No active database session to export', 'warning');
        return;
    }
    
    simulation.ui.showNotification('Database export initiated. Check console for progress.', 'info');
    console.log('🗄️ Use "npm run db:export" for comprehensive database export');
}

// Export for use in other modules if needed
export { simulation, CONFIG };