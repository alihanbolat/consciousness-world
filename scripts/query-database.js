#!/usr/bin/env node

/**
 * Database Query Utility - Interactive tool for analyzing simulation data
 * 
 * Usage: npm run db:query [session_id]
 * 
 * Provides comprehensive analysis of:
 * - Entity evolution and neural network changes
 * - Population fitness trends over time
 * - Behavioral pattern analysis
 * - Memory and experience tracking
 * - Lineage and genetic relationships
 */

import { DatabaseManager } from '../src/utils/DatabaseManager.js';
import { NeuralNetwork } from '../src/neural/NeuralNetwork.js';
import readline from 'readline';

const db = new DatabaseManager();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    console.log('🧠 Consciousness World Database Analysis Tool');
    console.log('============================================\n');

    try {
        // Get basic database stats
        const stats = db.getDatabaseStats();
        console.log('📊 Database Statistics:');
        console.log(`   Sessions: ${stats.sessions}`);
        console.log(`   Entities: ${stats.entities}`);
        console.log(`   Neural Networks: ${stats.networks}`);
        console.log(`   Metrics Records: ${stats.metrics}`);
        console.log(`   Memory Records: ${stats.memories}`);
        console.log(`   Evolution Events: ${stats.events}\n`);

        // Get session ID
        const sessionId = process.argv[2] || await getLatestSessionId();
        
        if (!sessionId) {
            console.log('❌ No sessions found in database.');
            process.exit(1);
        }

        console.log(`🔍 Analyzing session: ${sessionId}\n`);

        // Main analysis menu
        while (true) {
            console.log('\n📋 Analysis Options:');
            console.log('1. Population fitness trends');
            console.log('2. Entity evolution timeline');
            console.log('3. Neural network analysis');
            console.log('4. Behavioral pattern analysis');
            console.log('5. Best performing entities');
            console.log('6. Entity lineage and genetics');
            console.log('7. Custom SQL query');
            console.log('8. Export session data');
            console.log('0. Exit');

            const choice = await askQuestion('\nSelect analysis option (0-8): ');

            switch (choice.trim()) {
                case '1':
                    await analyzePopulationTrends(sessionId);
                    break;
                case '2':
                    await analyzeEntityEvolution(sessionId);
                    break;
                case '3':
                    await analyzeNeuralNetworks(sessionId);
                    break;
                case '4':
                    await analyzeBehavioralPatterns(sessionId);
                    break;
                case '5':
                    await analyzeTopEntities(sessionId);
                    break;
                case '6':
                    await analyzeEntityLineage(sessionId);
                    break;
                case '7':
                    await executeCustomQuery();
                    break;
                case '8':
                    await exportSessionData(sessionId);
                    break;
                case '0':
                    console.log('👋 Goodbye!');
                    process.exit(0);
                default:
                    console.log('❌ Invalid option. Please try again.');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

async function getLatestSessionId() {
    const stmt = db.db.prepare(`
        SELECT id FROM sessions 
        ORDER BY start_time DESC 
        LIMIT 1
    `);
    
    const result = stmt.get();
    return result?.id;
}

async function analyzePopulationTrends(sessionId) {
    console.log('\n📈 Population Fitness Trends Analysis');
    console.log('=====================================');

    const trends = db.getPopulationTrends(sessionId);
    
    if (trends.length === 0) {
        console.log('❌ No population data found for this session.');
        return;
    }

    // Basic statistics
    const firstTick = trends[0];
    const lastTick = trends[trends.length - 1];
    const maxFitness = Math.max(...trends.map(t => t.best_fitness));
    const avgSurvivalRate = trends.reduce((sum, t) => sum + t.living_count, 0) / trends.length;

    console.log(`📊 Summary (${trends.length} data points):`);
    console.log(`   Duration: Tick ${firstTick.tick} to ${lastTick.tick}`);
    console.log(`   Peak Fitness: ${maxFitness.toFixed(2)}`);
    console.log(`   Average Population: ${avgSurvivalRate.toFixed(1)}/5`);
    console.log(`   Total Deaths: ${lastTick.total_deaths}`);
    console.log(`   Final Generation: ${lastTick.generation}`);

    // Fitness progression (show every 10th data point)
    console.log('\n🏆 Fitness Progression:');
    console.log('Tick\t|\tBest\t|\tAvg\t|\tAlive\t|\tGen');
    console.log('--------|-------|-------|-------|-------');
    
    for (let i = 0; i < trends.length; i += Math.max(1, Math.floor(trends.length / 10))) {
        const t = trends[i];
        console.log(`${t.tick}\t|\t${t.best_fitness.toFixed(1)}\t|\t${t.average_fitness.toFixed(1)}\t|\t${t.living_count}\t|\t${t.generation}`);
    }

    // Evolution events analysis
    const stmt = db.db.prepare(`
        SELECT event_type, COUNT(*) as count 
        FROM evolution_events 
        WHERE session_id = ? 
        GROUP BY event_type
    `);
    
    const events = stmt.all(sessionId);
    console.log('\n🧬 Evolution Events:');
    events.forEach(event => {
        console.log(`   ${event.event_type}: ${event.count} times`);
    });
}

async function analyzeEntityEvolution(sessionId) {
    console.log('\n🔬 Entity Evolution Timeline');
    console.log('============================');

    const entityId = await askQuestion('Enter entity ID (or press Enter for random): ');
    
    let targetEntity;
    if (entityId.trim()) {
        targetEntity = { id: entityId.trim() };
    } else {
        // Get a random entity with neural network data
        const stmt = db.db.prepare(`
            SELECT DISTINCT entity_id as id FROM neural_networks 
            WHERE session_id = ? 
            ORDER BY RANDOM() 
            LIMIT 1
        `);
        targetEntity = stmt.get(sessionId);
    }

    if (!targetEntity) {
        console.log('❌ No entities with neural network data found.');
        return;
    }

    console.log(`\n🧠 Evolution of Entity: ${targetEntity.id}`);
    
    // Get entity basic info
    const entityInfo = db.db.prepare(`
        SELECT * FROM entities 
        WHERE id = ? AND session_id = ?
    `).get(targetEntity.id, sessionId);

    if (entityInfo) {
        console.log(`📋 Basic Info:`);
        console.log(`   Born: Tick ${entityInfo.birth_tick} (Generation ${entityInfo.generation})`);
        console.log(`   ${entityInfo.death_tick ? `Died: Tick ${entityInfo.death_tick}` : 'Still alive'}`);
        console.log(`   Fitness: ${entityInfo.fitness || 'N/A'}`);
        console.log(`   Energy Gained: ${entityInfo.total_energy_gained || 0}`);
        console.log(`   Parent: ${entityInfo.parent_id || 'None (original)'}`);
    }

    // Get neural network evolution
    const evolution = db.getEntityEvolution(sessionId, targetEntity.id);
    
    if (evolution.length > 0) {
        console.log(`\n🧠 Neural Network Snapshots (${evolution.length} records):`);
        console.log('Tick\t|\tParameters\t|\tArchitecture Hash');
        console.log('--------|---------------|-------------------');
        
        evolution.forEach(snapshot => {
            console.log(`${snapshot.tick}\t|\t${snapshot.total_parameters}\t|\t${snapshot.architecture_hash}`);
        });

        // Analyze network changes
        if (evolution.length >= 2) {
            console.log('\n🔄 Network Evolution Analysis:');
            
            for (let i = 1; i < Math.min(evolution.length, 5); i++) {
                const prev = evolution[i-1];
                const curr = evolution[i];
                
                try {
                    const prevNetwork = NeuralNetwork.deserialize(JSON.parse(prev.network_data));
                    const currNetwork = NeuralNetwork.deserialize(JSON.parse(curr.network_data));
                    const similarity = prevNetwork.calculateSimilarity(currNetwork);
                    
                    console.log(`   Tick ${prev.tick} → ${curr.tick}: ${(similarity * 100).toFixed(1)}% similarity`);
                } catch (error) {
                    console.log(`   Tick ${prev.tick} → ${curr.tick}: Analysis failed`);
                }
            }
        }
    }

    // Get behavioral metrics
    const metrics = db.db.prepare(`
        SELECT tick, x, y, energy, action, reward, memory_count,
               field1_avg, field2_avg, field3_avg, field4_avg, field5_avg
        FROM entity_metrics 
        WHERE entity_id = ? AND session_id = ?
        ORDER BY tick ASC
        LIMIT 20
    `).all(targetEntity.id, sessionId);

    if (metrics.length > 0) {
        console.log(`\n📊 Behavioral Metrics (first 20 records):`);
        console.log('Tick\t|\tPos\t|\tEnergy\t|\tAction\t|\tF1\t|\tF3(Energy)');
        console.log('--------|-------|-------|-------|-------|-------------');
        
        metrics.forEach(m => {
            console.log(`${m.tick}\t|\t(${m.x},${m.y})\t|\t${m.energy.toFixed(0)}\t|\t${m.action}\t|\t${m.field1_avg.toFixed(2)}\t|\t${m.field3_avg.toFixed(2)}`);
        });
    }
}

async function analyzeNeuralNetworks(sessionId) {
    console.log('\n🧠 Neural Network Analysis');
    console.log('==========================');

    // Get network architecture distribution
    const architectures = db.db.prepare(`
        SELECT architecture_hash, total_parameters, COUNT(*) as count
        FROM neural_networks 
        WHERE session_id = ?
        GROUP BY architecture_hash, total_parameters
        ORDER BY count DESC
    `).all(sessionId);

    console.log('🏗️ Architecture Distribution:');
    architectures.forEach(arch => {
        console.log(`   Hash ${arch.architecture_hash}: ${arch.total_parameters} params (${arch.count} snapshots)`);
    });

    // Weight statistics evolution
    const networkSnapshots = db.db.prepare(`
        SELECT tick, network_data 
        FROM neural_networks 
        WHERE session_id = ?
        ORDER BY tick ASC
        LIMIT 10
    `).all(sessionId);

    if (networkSnapshots.length > 0) {
        console.log('\n📊 Weight Statistics Evolution:');
        console.log('Tick\t|\tWeight Mean\t|\tWeight Std\t|\tBias Mean');
        console.log('--------|---------------|---------------|-------------');

        for (const snapshot of networkSnapshots) {
            try {
                const network = NeuralNetwork.deserialize(JSON.parse(snapshot.network_data));
                const stats = network.getWeightStats();
                console.log(`${snapshot.tick}\t|\t${stats.weights.mean.toFixed(4)}\t|\t${stats.weights.std.toFixed(4)}\t|\t${stats.biases.mean.toFixed(4)}`);
            } catch (error) {
                console.log(`${snapshot.tick}\t|\tAnalysis failed`);
            }
        }
    }
}

async function analyzeBehavioralPatterns(sessionId) {
    console.log('\n🎯 Behavioral Pattern Analysis');
    console.log('==============================');

    // Action distribution
    const actions = db.db.prepare(`
        SELECT action, COUNT(*) as count
        FROM entity_metrics 
        WHERE session_id = ?
        GROUP BY action
        ORDER BY count DESC
    `).all(sessionId);

    console.log('🚶 Action Distribution:');
    const totalActions = actions.reduce((sum, a) => sum + a.count, 0);
    actions.forEach(action => {
        const percentage = (action.count / totalActions * 100).toFixed(1);
        console.log(`   ${action.action}: ${action.count} times (${percentage}%)`);
    });

    // Energy vs behavior correlation
    const energyBehavior = db.db.prepare(`
        SELECT 
            CASE 
                WHEN energy > 80 THEN 'High Energy (>80)'
                WHEN energy > 50 THEN 'Medium Energy (50-80)'
                WHEN energy > 20 THEN 'Low Energy (20-50)'
                ELSE 'Critical Energy (<20)'
            END as energy_level,
            action,
            COUNT(*) as count
        FROM entity_metrics 
        WHERE session_id = ?
        GROUP BY energy_level, action
        ORDER BY energy_level, count DESC
    `).all(sessionId);

    console.log('\n⚡ Energy vs Action Patterns:');
    let currentEnergyLevel = '';
    energyBehavior.forEach(row => {
        if (row.energy_level !== currentEnergyLevel) {
            console.log(`\n   ${row.energy_level}:`);
            currentEnergyLevel = row.energy_level;
        }
        console.log(`     ${row.action}: ${row.count} times`);
    });

    // Field perception analysis
    const fieldAnalysis = db.db.prepare(`
        SELECT 
            AVG(field1_avg) as avg_field1,
            AVG(field2_avg) as avg_field2, 
            AVG(field3_avg) as avg_field3,
            AVG(field4_avg) as avg_field4,
            AVG(field5_avg) as avg_field5,
            AVG(vision_confidence_avg) as avg_confidence
        FROM entity_metrics 
        WHERE session_id = ?
    `).get(sessionId);

    if (fieldAnalysis) {
        console.log('\n👁️ Average Sensory Field Values:');
        console.log(`   Field 1 (Thermal): ${fieldAnalysis.avg_field1.toFixed(3)}`);
        console.log(`   Field 2 (Matter): ${fieldAnalysis.avg_field2.toFixed(3)}`);
        console.log(`   Field 3 (Energy): ${fieldAnalysis.avg_field3.toFixed(3)}`);
        console.log(`   Field 4 (Spatial): ${fieldAnalysis.avg_field4.toFixed(3)}`);
        console.log(`   Field 5 (Life): ${fieldAnalysis.avg_field5.toFixed(3)}`);
        console.log(`   Vision Confidence: ${fieldAnalysis.avg_confidence.toFixed(3)}`);
    }
}

async function analyzeTopEntities(sessionId) {
    console.log('\n🏆 Top Performing Entities');
    console.log('==========================');

    const topEntities = db.getTopEntities(sessionId, 10);
    
    if (topEntities.length === 0) {
        console.log('❌ No entities found with fitness data.');
        return;
    }

    console.log('Rank\t|\tEntity ID\t|\tFitness\t|\tAge\t|\tEnergy Gained');
    console.log('--------|---------------|-------|-------|---------------');
    
    topEntities.forEach((entity, index) => {
        console.log(`${index + 1}\t|\t${entity.id.substring(0, 8)}\t|\t${entity.fitness.toFixed(1)}\t|\t${entity.age_at_death}\t|\t${entity.total_energy_gained}`);
    });

    // Analyze the best entity
    if (topEntities.length > 0) {
        const best = topEntities[0];
        console.log(`\n👑 Best Entity Analysis: ${best.id}`);
        console.log(`   Fitness: ${best.fitness.toFixed(2)}`);
        console.log(`   Lifespan: ${best.age_at_death} ticks`);
        console.log(`   Energy Efficiency: ${(best.total_energy_gained / best.age_at_death).toFixed(2)} energy/tick`);
        
        // Get lineage
        const lineage = db.getEntityLineage(sessionId, best.id, 5);
        if (lineage.length > 1) {
            console.log(`   Lineage: ${lineage.length} generations`);
            lineage.forEach((ancestor, i) => {
                console.log(`     Gen ${i}: ${ancestor.id.substring(0, 8)} (Fitness: ${ancestor.fitness?.toFixed(1) || 'N/A'})`);
            });
        }
    }
}

async function analyzeEntityLineage(sessionId) {
    console.log('\n🌳 Entity Lineage Analysis');
    console.log('==========================');

    const entityId = await askQuestion('Enter entity ID: ');
    
    if (!entityId.trim()) {
        console.log('❌ Entity ID required.');
        return;
    }

    const lineage = db.getEntityLineage(sessionId, entityId.trim(), 10);
    
    if (lineage.length === 0) {
        console.log('❌ Entity not found or no lineage data available.');
        return;
    }

    console.log(`\n🧬 Lineage for Entity: ${entityId.trim()}`);
    console.log('Generation\t|\tEntity ID\t|\tFitness\t|\tAge\t|\tParent');
    console.log('------------|---------------|-------|-------|-------------');
    
    lineage.forEach((entity, index) => {
        const parentDisplay = entity.parent_id ? entity.parent_id.substring(0, 8) : 'None';
        const fitnessDisplay = entity.fitness ? entity.fitness.toFixed(1) : 'N/A';
        console.log(`${index}\t\t|\t${entity.id.substring(0, 8)}\t|\t${fitnessDisplay}\t|\t${entity.age_at_death || 'Alive'}\t|\t${parentDisplay}`);
    });

    // Fitness progression analysis
    const fitnessValues = lineage.filter(e => e.fitness !== null).map(e => e.fitness);
    if (fitnessValues.length > 1) {
        const improvement = fitnessValues[fitnessValues.length - 1] - fitnessValues[0];
        console.log(`\n📈 Fitness Evolution: ${improvement > 0 ? '+' : ''}${improvement.toFixed(2)} over ${fitnessValues.length} generations`);
    }
}

async function executeCustomQuery() {
    console.log('\n💻 Custom SQL Query');
    console.log('==================');

    const query = await askQuestion('Enter SQL query: ');
    
    if (!query.trim()) {
        console.log('❌ Query cannot be empty.');
        return;
    }

    try {
        const stmt = db.db.prepare(query);
        const results = stmt.all();
        
        console.log(`\n📊 Query Results (${results.length} rows):`);
        
        if (results.length > 0) {
            // Show column headers
            const headers = Object.keys(results[0]);
            console.log(headers.join('\t|\t'));
            console.log(headers.map(() => '-------').join('|'));
            
            // Show data (limit to 20 rows)
            results.slice(0, 20).forEach(row => {
                const values = headers.map(header => {
                    const value = row[header];
                    if (typeof value === 'number') {
                        return Number.isInteger(value) ? value.toString() : value.toFixed(3);
                    }
                    return value?.toString() || 'NULL';
                });
                console.log(values.join('\t|\t'));
            });
            
            if (results.length > 20) {
                console.log(`\n... and ${results.length - 20} more rows`);
            }
        } else {
            console.log('No results returned.');
        }
    } catch (error) {
        console.log(`❌ Query error: ${error.message}`);
    }
}

async function exportSessionData(sessionId) {
    console.log('\n💾 Export Session Data');
    console.log('=====================');

    try {
        // Get session info
        const session = db.db.prepare(`
            SELECT * FROM sessions WHERE id = ?
        `).get(sessionId);

        if (!session) {
            console.log('❌ Session not found.');
            return;
        }

        // Export comprehensive data
        const exportData = {
            session: session,
            entities: db.db.prepare(`
                SELECT * FROM entities WHERE session_id = ?
            `).all(sessionId),
            
            populationStats: db.getPopulationTrends(sessionId),
            
            topEntities: db.getTopEntities(sessionId, 20),
            
            evolutionEvents: db.db.prepare(`
                SELECT * FROM evolution_events WHERE session_id = ? ORDER BY tick
            `).all(sessionId),
            
            behaviorSummary: db.db.prepare(`
                SELECT action, COUNT(*) as count, AVG(energy) as avg_energy
                FROM entity_metrics 
                WHERE session_id = ?
                GROUP BY action
            `).all(sessionId)
        };

        // Write to file
        const filename = `consciousness-analysis-${sessionId.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.json`;
        await import('fs').then(fs => {
            fs.promises.writeFile(filename, JSON.stringify(exportData, null, 2));
        });

        console.log(`✅ Data exported to: ${filename}`);
        console.log(`   Session: ${session.name}`);
        console.log(`   Entities: ${exportData.entities.length}`);
        console.log(`   Population Data Points: ${exportData.populationStats.length}`);
        console.log(`   Evolution Events: ${exportData.evolutionEvents.length}`);
        
    } catch (error) {
        console.log(`❌ Export failed: ${error.message}`);
    }
}

function askQuestion(question) {
    return new Promise(resolve => {
        rl.question(question, answer => resolve(answer));
    });
}

// Run the main function
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
}).finally(() => {
    db.close();
    rl.close();
});