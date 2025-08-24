/**
 * World Renderer - Handles all visualization and rendering
 * 
 * Features:
 * - Canvas-based rendering of world state
 * - Multi-layer visualization (temperature, catalyser, cores, energies, entities)
 * - Real-time UI updates
 * - Visual debugging and analysis tools
 * - Responsive rendering with proper scaling
 */

export class WorldRenderer {
    constructor(canvasId, gridSize = 100, cellSize = 5) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = gridSize;
        this.cellSize = cellSize;
        
        // Visual settings
        this.showTemperature = true;
        this.showCatalyser = true;
        this.showCores = true;
        this.showEnergies = true;
        this.showEntities = true;
        this.showEntityPaths = false;
        this.showVision = false;
        this.selectedEntity = null;
        
        // Entity colors
        this.entityColors = ['#ff0000', '#ff6600', '#ffaa00', '#ffdd00', '#ffff00'];
        
        // Initialize canvas size
        this.canvas.width = gridSize * cellSize;
        this.canvas.height = gridSize * cellSize;
        
        // Entity path tracking
        this.entityPaths = new Map();
        this.maxPathLength = 50;
    }
    
    /**
     * Render the complete world state
     */
    render(world, population) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render layers in order
        if (this.showTemperature) this.renderTemperature(world);
        if (this.showCatalyser) this.renderCatalyser(world);
        if (this.showCores) this.renderCores(world);
        if (this.showEnergies) this.renderEnergies(world);
        if (this.showEntityPaths) this.renderEntityPaths();
        if (this.showEntities) this.renderEntities(population);
        if (this.showVision && this.selectedEntity) this.renderVision(this.selectedEntity);
    }
    
    /**
     * Render temperature field
     */
    renderTemperature(world) {
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const temp = world.lowerDimension.temperature[x][y];
                if (temp > 0.1) { // Only render significant temperatures
                    this.ctx.fillStyle = `rgba(255, 100, 0, ${temp * 0.3})`;
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }
    }
    
    /**
     * Render catalyser field
     */
    renderCatalyser(world) {
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const catalyser = world.lowerDimension.catalyser[x][y];
                if (catalyser > 0.1) { // Only render significant catalyser
                    this.ctx.fillStyle = `rgba(0, 100, 255, ${Math.min(catalyser, 1) * 0.5})`;
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }
    }
    
    /**
     * Render cores with state-based colors
     */
    renderCores(world) {
        world.lowerDimension.cores.forEach(core => {
            let color = '#444';
            if (core.state === 'incubated') color = '#666';
            if (core.state === 'bloomed') color = '#888';
            
            this.ctx.fillStyle = color;
            this.ctx.fillRect(core.x * this.cellSize, core.y * this.cellSize, this.cellSize, this.cellSize);
            
            // Add state indicator
            if (core.state !== 'dormant') {
                this.ctx.fillStyle = core.state === 'incubated' ? '#yellow' : '#white';
                this.ctx.fillRect(
                    core.x * this.cellSize + 1, 
                    core.y * this.cellSize + 1, 
                    this.cellSize - 2, 
                    this.cellSize - 2
                );
            }
        });
    }
    
    /**
     * Render energy manifestations
     */
    renderEnergies(world) {
        world.lowerDimension.energies.forEach(energy => {
            if (energy.active) {
                // Pulsing effect based on age
                const age = Date.now() - energy.createdAt;
                const pulse = Math.sin(age * 0.01) * 0.2 + 0.8;
                
                this.ctx.fillStyle = `rgba(0, 255, 0, ${pulse})`;
                this.ctx.fillRect(energy.x * this.cellSize, energy.y * this.cellSize, this.cellSize, this.cellSize);
                
                // Add glow effect
                this.ctx.fillStyle = `rgba(0, 255, 0, ${pulse * 0.3})`;
                this.ctx.fillRect(
                    energy.x * this.cellSize - 1, 
                    energy.y * this.cellSize - 1, 
                    this.cellSize + 2, 
                    this.cellSize + 2
                );
            }
        });
    }
    
    /**
     * Render conscious entities
     */
    renderEntities(population) {
        const entities = population.getLivingEntities();
        
        entities.forEach((entity, index) => {
            // Track entity path
            if (this.showEntityPaths) {
                this.updateEntityPath(entity.id, entity.x, entity.y);
            }
            
            // Entity color based on index and energy level
            const baseColor = this.entityColors[index % this.entityColors.length];
            const energyFactor = Math.min(1, Math.max(0.3, entity.energy / 100));
            
            this.ctx.fillStyle = this.adjustColorBrightness(baseColor, energyFactor);
            this.ctx.fillRect(entity.x * this.cellSize, entity.y * this.cellSize, this.cellSize, this.cellSize);
            
            // Add selection indicator
            if (this.selectedEntity && this.selectedEntity.id === entity.id) {
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(
                    entity.x * this.cellSize - 1, 
                    entity.y * this.cellSize - 1, 
                    this.cellSize + 2, 
                    this.cellSize + 2
                );
            }
            
            // Add entity info on hover
            if (entity.x * this.cellSize <= this.mouseX && this.mouseX <= (entity.x + 1) * this.cellSize &&
                entity.y * this.cellSize <= this.mouseY && this.mouseY <= (entity.y + 1) * this.cellSize) {
                this.renderEntityTooltip(entity);
            }
        });
    }
    
    /**
     * Update entity movement path
     */
    updateEntityPath(entityId, x, y) {
        if (!this.entityPaths.has(entityId)) {
            this.entityPaths.set(entityId, []);
        }
        
        const path = this.entityPaths.get(entityId);
        path.push({ x, y, timestamp: Date.now() });
        
        // Keep only recent positions
        if (path.length > this.maxPathLength) {
            path.shift();
        }
    }
    
    /**
     * Render entity movement paths
     */
    renderEntityPaths() {
        this.entityPaths.forEach((path, entityId) => {
            if (path.length < 2) return;
            
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            
            for (let i = 0; i < path.length - 1; i++) {
                const current = path[i];
                const next = path[i + 1];
                
                const currentX = current.x * this.cellSize + this.cellSize / 2;
                const currentY = current.y * this.cellSize + this.cellSize / 2;
                const nextX = next.x * this.cellSize + this.cellSize / 2;
                const nextY = next.y * this.cellSize + this.cellSize / 2;
                
                if (i === 0) {
                    this.ctx.moveTo(currentX, currentY);
                }
                this.ctx.lineTo(nextX, nextY);
            }
            
            this.ctx.stroke();
        });
    }
    
    /**
     * Render entity vision cone
     */
    renderVision(entity) {
        if (!entity.vision || entity.vision.length === 0) return;
        
        // Render vision grid
        entity.vision.forEach(visionPoint => {
            const worldX = entity.x + visionPoint.relativeX;
            const worldY = entity.y + visionPoint.relativeY;
            
            // Skip out-of-bounds positions
            if (worldX < 0 || worldX >= this.gridSize || worldY < 0 || worldY >= this.gridSize) return;
            
            // Color based on confidence
            const alpha = visionPoint.confidence * 0.3;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fillRect(worldX * this.cellSize, worldY * this.cellSize, this.cellSize, this.cellSize);
            
            // Add field strength indicators
            const centerX = worldX * this.cellSize + this.cellSize / 2;
            const centerY = worldY * this.cellSize + this.cellSize / 2;
            
            // Field 3 (energy potential) as bright dots
            if (visionPoint.field3 > 0.5) {
                this.ctx.fillStyle = `rgba(0, 255, 0, ${visionPoint.field3})`;
                this.ctx.fillRect(centerX - 1, centerY - 1, 2, 2);
            }
            
            // Field 5 (life force) as red dots
            if (visionPoint.field5 > 0.3) {
                this.ctx.fillStyle = `rgba(255, 0, 0, ${visionPoint.field5})`;
                this.ctx.fillRect(centerX - 1, centerY - 1, 2, 2);
            }
        });
    }
    
    /**
     * Render entity tooltip
     */
    renderEntityTooltip(entity) {
        const tooltip = `ID: ${entity.id}\nEnergy: ${Math.round(entity.energy)}\nAge: ${entity.age}\nFitness: ${Math.round(entity.fitness)}`;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(this.mouseX + 10, this.mouseY - 60, 120, 50);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        const lines = tooltip.split('\n');
        lines.forEach((line, index) => {
            this.ctx.fillText(line, this.mouseX + 15, this.mouseY - 45 + index * 12);
        });
    }
    
    /**
     * Adjust color brightness
     */
    adjustColorBrightness(color, factor) {
        // Simple brightness adjustment
        const hex = color.replace('#', '');
        const r = Math.round(parseInt(hex.substr(0, 2), 16) * factor);
        const g = Math.round(parseInt(hex.substr(2, 2), 16) * factor);
        const b = Math.round(parseInt(hex.substr(4, 2), 16) * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * Set rendering options
     */
    setRenderOptions(options) {
        Object.assign(this, options);
    }
    
    /**
     * Select entity for detailed visualization
     */
    selectEntity(entity) {
        this.selectedEntity = entity;
        this.showVision = entity !== null;
    }
    
    /**
     * Handle mouse events for interaction
     */
    setupMouseEvents() {
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.canvas.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = event.clientX - rect.left;
            this.mouseY = event.clientY - rect.top;
        });
        
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((event.clientX - rect.left) / this.cellSize);
            const y = Math.floor((event.clientY - rect.top) / this.cellSize);
            
            // Emit click event with grid coordinates
            this.canvas.dispatchEvent(new CustomEvent('gridClick', {
                detail: { x, y }
            }));
        });
    }
    
    /**
     * Clear entity paths
     */
    clearPaths() {
        this.entityPaths.clear();
    }
    
    /**
     * Export current frame as image data
     */
    exportFrame() {
        return this.canvas.toDataURL('image/png');
    }
    
    /**
     * Set canvas size
     */
    setCanvasSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.cellSize = Math.min(width / this.gridSize, height / this.gridSize);
    }
}