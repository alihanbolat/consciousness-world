#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * Usage: npm run db:init
 * 
 * Initializes the SQLite database with all required tables and indexes
 * for consciousness simulation data tracking.
 */

import { DatabaseManager } from '../src/utils/DatabaseManager.js';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log('🗄️ Initializing Consciousness World Database');
    console.log('============================================\n');

    try {
        // Ensure data directory exists
        const dataDir = 'data';
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log(`📁 Created data directory: ${dataDir}`);
        }

        // Initialize database
        const dbPath = 'data/consciousness-evolution.db';
        console.log(`🔧 Initializing database: ${dbPath}`);
        
        const db = new DatabaseManager(dbPath);
        
        // Get database statistics
        const stats = db.getDatabaseStats();
        
        console.log('\n✅ Database initialized successfully!');
        console.log('\n📊 Current Database Statistics:');
        console.log(`   Sessions: ${stats.sessions}`);
        console.log(`   Entities: ${stats.entities}`);
        console.log(`   Neural Networks: ${stats.networks}`);
        console.log(`   Metrics Records: ${stats.metrics}`);
        console.log(`   Memory Records: ${stats.memories}`);
        console.log(`   Evolution Events: ${stats.events}`);
        
        console.log('\n📋 Tables Created:');
        console.log('   • sessions - Simulation session metadata');
        console.log('   • entities - Individual entity lifecycle tracking');
        console.log('   • neural_networks - Neural network snapshots and evolution');
        console.log('   • entity_metrics - Per-tick performance and behavioral data');
        console.log('   • entity_memories - Experience and memory tracking');
        console.log('   • population_stats - Population-level statistics');
        console.log('   • evolution_events - Birth, death, and mutation events');
        
        console.log('\n🚀 Ready for simulation data collection!');
        console.log('\nNext steps:');
        console.log('1. Run your consciousness simulation');
        console.log('2. Use "npm run db:query" to analyze collected data');
        console.log('3. Use "npm run db:export" to export data for external analysis');
        
        // Close database connection
        db.close();

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        process.exit(1);
    }
}

main();