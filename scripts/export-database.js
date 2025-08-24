#!/usr/bin/env node

/**
 * Database Export Utility
 * 
 * Usage: npm run db:export [session_id] [format]
 * 
 * Exports consciousness simulation data in various formats:
 * - JSON: Complete structured data
 * - CSV: Tabular data for spreadsheet analysis
 * - SQL: Database dump for backup/migration
 */

import { DatabaseManager } from '../src/utils/DatabaseManager.js';
import fs from 'fs';
import path from 'path';

const db = new DatabaseManager();

async function main() {
    console.log('💾 Consciousness World Database Export');
    console.log('====================================\n');

    const sessionId = process.argv[2];
    const format = (process.argv[3] || 'json').toLowerCase();

    try {
        if (!sessionId) {
            // Show available sessions
            await showAvailableSessions();
            return;
        }

        // Validate session exists
        const session = db.db.prepare(`
            SELECT * FROM sessions WHERE id = ?
        `).get(sessionId);

        if (!session) {
            console.log(`❌ Session '${sessionId}' not found.`);
            await showAvailableSessions();
            return;
        }

        console.log(`📊 Exporting session: ${session.name}`);
        console.log(`📅 Created: ${new Date(session.start_time).toLocaleString()}`);
        console.log(`⚙️ Format: ${format.toUpperCase()}\n`);

        // Create exports directory
        const exportDir = 'exports';
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        switch (format) {
            case 'json':
                await exportJSON(sessionId, session);
                break;
            case 'csv':
                await exportCSV(sessionId, session);
                break;
            case 'sql':
                await exportSQL(sessionId, session);
                break;
            default:
                console.log(`❌ Unsupported format: ${format}`);
                console.log('Supported formats: json, csv, sql');
        }

    } catch (error) {
        console.error('❌ Export failed:', error.message);
        process.exit(1);
    } finally {
        db.close();
    }
}

async function showAvailableSessions() {
    console.log('📋 Available Sessions:');
    console.log('=====================\n');

    const sessions = db.db.prepare(`
        SELECT id, name, start_time, end_time, total_ticks, total_entities, peak_fitness
        FROM sessions 
        ORDER BY start_time DESC
    `).all();

    if (sessions.length === 0) {
        console.log('No sessions found. Run a simulation first to generate data.');
        return;
    }

    console.log('Session ID\t|\tName\t|\tStart Time\t|\tTicks\t|\tEntities\t|\tPeak Fitness');
    console.log('------------|-------|-----------|-------|---------|-------------');

    sessions.forEach(session => {
        const startTime = new Date(session.start_time).toLocaleDateString();
        const sessionId = session.id.substring(0, 15) + '...';
        const name = (session.name || 'Unnamed').substring(0, 20);
        
        console.log(`${sessionId}\t|\t${name}\t|\t${startTime}\t|\t${session.total_ticks || 0}\t|\t${session.total_entities || 0}\t|\t${session.peak_fitness?.toFixed(1) || 'N/A'}`);
    });

    console.log('\nUsage: npm run db:export <session_id> [format]');
    console.log('Formats: json (default), csv, sql');
}

async function exportJSON(sessionId, session) {
    console.log('🔄 Collecting data...');

    const exportData = {
        metadata: {
            exportedAt: new Date().toISOString(),
            exportTool: 'consciousness-world-db-export',
            version: '1.0'
        },
        
        session: session,
        
        entities: db.db.prepare(`
            SELECT * FROM entities WHERE session_id = ? ORDER BY birth_tick
        `).all(sessionId),
        
        neuralNetworks: db.db.prepare(`
            SELECT * FROM neural_networks WHERE session_id = ? ORDER BY tick, entity_id
        `).all(sessionId),
        
        populationStats: db.db.prepare(`
            SELECT * FROM population_stats WHERE session_id = ? ORDER BY tick
        `).all(sessionId),
        
        evolutionEvents: db.db.prepare(`
            SELECT * FROM evolution_events WHERE session_id = ? ORDER BY tick
        `).all(sessionId),
        
        entityMetrics: db.db.prepare(`
            SELECT * FROM entity_metrics WHERE session_id = ? ORDER BY tick, entity_id
        `).all(sessionId),
        
        entityMemories: db.db.prepare(`
            SELECT * FROM entity_memories WHERE session_id = ? ORDER BY current_tick, entity_id
        `).all(sessionId)
    };

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const sessionName = session.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `exports/consciousness_${sessionName}_${timestamp}.json`;

    // Write file
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));

    console.log(`✅ JSON export completed: ${filename}`);
    console.log(`📊 Data Summary:`);
    console.log(`   Entities: ${exportData.entities.length}`);
    console.log(`   Neural Network Snapshots: ${exportData.neuralNetworks.length}`);
    console.log(`   Population Data Points: ${exportData.populationStats.length}`);
    console.log(`   Evolution Events: ${exportData.evolutionEvents.length}`);
    console.log(`   Entity Metrics: ${exportData.entityMetrics.length}`);
    console.log(`   Memory Records: ${exportData.entityMemories.length}`);
    console.log(`   File Size: ${(fs.statSync(filename).size / 1024 / 1024).toFixed(2)} MB`);
}

async function exportCSV(sessionId, session) {
    console.log('🔄 Generating CSV files...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const sessionName = session.name.replace(/[^a-zA-Z0-9]/g, '_');
    const baseFilename = `consciousness_${sessionName}_${timestamp}`;

    // Export entities
    await exportTableToCSV('entities', sessionId, `exports/${baseFilename}_entities.csv`);
    
    // Export population stats
    await exportTableToCSV('population_stats', sessionId, `exports/${baseFilename}_population.csv`);
    
    // Export entity metrics (sample to avoid huge files)
    const metricsQuery = `
        SELECT * FROM entity_metrics 
        WHERE session_id = ? AND tick % 5 = 0 
        ORDER BY tick, entity_id
    `;
    await exportQueryToCSV(metricsQuery, [sessionId], `exports/${baseFilename}_metrics_sample.csv`);
    
    // Export evolution events
    await exportTableToCSV('evolution_events', sessionId, `exports/${baseFilename}_evolution.csv`);

    console.log('✅ CSV export completed:');
    console.log(`   📁 exports/${baseFilename}_entities.csv`);
    console.log(`   📁 exports/${baseFilename}_population.csv`);
    console.log(`   📁 exports/${baseFilename}_metrics_sample.csv`);
    console.log(`   📁 exports/${baseFilename}_evolution.csv`);
}

async function exportTableToCSV(tableName, sessionId, filename) {
    const data = db.db.prepare(`SELECT * FROM ${tableName} WHERE session_id = ?`).all(sessionId);
    
    if (data.length === 0) {
        console.log(`⚠️  No data found in ${tableName}`);
        return;
    }

    // Generate CSV content
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    fs.writeFileSync(filename, csvContent);
}

async function exportQueryToCSV(query, params, filename) {
    const data = db.db.prepare(query).all(...params);
    
    if (data.length === 0) {
        console.log(`⚠️  No data returned from query`);
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    fs.writeFileSync(filename, csvContent);
}

async function exportSQL(sessionId, session) {
    console.log('🔄 Generating SQL dump...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const sessionName = session.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `exports/consciousness_${sessionName}_${timestamp}.sql`;

    let sqlContent = [
        '-- Consciousness World Database Export',
        `-- Session: ${session.name}`,
        `-- Exported: ${new Date().toISOString()}`,
        `-- Session ID: ${sessionId}`,
        '',
        '-- Disable foreign key checks for import',
        'PRAGMA foreign_keys = OFF;',
        '',
        '-- Begin transaction',
        'BEGIN TRANSACTION;',
        ''
    ];

    // Export each table
    const tables = ['sessions', 'entities', 'neural_networks', 'entity_metrics', 
                   'entity_memories', 'population_stats', 'evolution_events'];

    for (const table of tables) {
        console.log(`   Exporting table: ${table}`);
        
        const data = db.db.prepare(`SELECT * FROM ${table} WHERE session_id = ? OR ? = 'sessions'`)
                         .all(sessionId, table);

        if (data.length > 0) {
            sqlContent.push(`-- Table: ${table}`);
            
            // Get column info
            const columns = db.db.prepare(`PRAGMA table_info(${table})`).all();
            const columnNames = columns.map(col => col.name);
            
            // Generate INSERT statements
            data.forEach(row => {
                const values = columnNames.map(col => {
                    const value = row[col];
                    if (value === null) return 'NULL';
                    if (typeof value === 'string') {
                        return `'${value.replace(/'/g, "''")}'`;
                    }
                    return value;
                }).join(', ');
                
                sqlContent.push(`INSERT INTO ${table} (${columnNames.join(', ')}) VALUES (${values});`);
            });
            
            sqlContent.push('');
        }
    }

    sqlContent.push('-- Commit transaction');
    sqlContent.push('COMMIT;');
    sqlContent.push('');
    sqlContent.push('-- Re-enable foreign key checks');
    sqlContent.push('PRAGMA foreign_keys = ON;');

    // Write file
    fs.writeFileSync(filename, sqlContent.join('\n'));

    console.log(`✅ SQL export completed: ${filename}`);
    console.log(`   File Size: ${(fs.statSync(filename).size / 1024).toFixed(1)} KB`);
    console.log('\nTo import this data:');
    console.log(`   sqlite3 new_database.db < ${filename}`);
}

main();