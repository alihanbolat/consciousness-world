/**
 * Neural Network Implementation for Consciousness Simulation
 * 
 * Features:
 * - Multi-layer feedforward architecture
 * - Gaussian weight initialization
 * - ReLU activation for hidden layers
 * - Softmax output for action probability distribution
 * - Mutation-based evolution
 * - REINFORCE learning for immediate feedback
 */

export class NeuralNetwork {
    constructor(inputSize, hiddenSizes, outputSize) {
        this.layers = [];
        const sizes = [inputSize, ...hiddenSizes, outputSize];
        
        // Initialize layers with random weights and biases
        for (let i = 1; i < sizes.length; i++) {
            const layer = {
                weights: this.randomMatrix(sizes[i], sizes[i-1], 0.1),
                biases: this.randomArray(sizes[i], 0.1)
            };
            this.layers.push(layer);
        }
        
        // Cache for Gaussian random number generation
        this.hasSpareGaussian = false;
        this.spareGaussian = 0;
    }
    
    /**
     * Create a random matrix with Gaussian distribution
     */
    randomMatrix(rows, cols, std) {
        return Array(rows).fill().map(() => 
            Array(cols).fill().map(() => this.gaussianRandom() * std)
        );
    }
    
    /**
     * Create a random array with Gaussian distribution
     */
    randomArray(size, std) {
        return Array(size).fill().map(() => this.gaussianRandom() * std);
    }
    
    /**
     * Generate Gaussian random numbers using Box-Muller transform
     */
    gaussianRandom() {
        if (this.hasSpareGaussian) {
            this.hasSpareGaussian = false;
            return this.spareGaussian;
        }
        
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        
        const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        const z1 = Math.sqrt(-2.0 * Math.log(u)) * Math.sin(2 * Math.PI * v);
        
        this.hasSpareGaussian = true;
        this.spareGaussian = z1;
        return z0;
    }
    
    /**
     * Forward pass through the network
     * @param {number[]} input - Input vector
     * @returns {number[]} - Action probabilities (softmax output)
     */
    forward(input) {
        let activation = input;
        
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            const newActivation = [];
            
            // Matrix multiplication: weights × activation + biases
            for (let j = 0; j < layer.weights.length; j++) {
                let sum = layer.biases[j];
                for (let k = 0; k < activation.length; k++) {
                    sum += layer.weights[j][k] * activation[k];
                }
                
                // Apply activation function
                if (i === this.layers.length - 1) {
                    // Output layer: linear activation (softmax applied later)
                    newActivation[j] = sum;
                } else {
                    // Hidden layers: ReLU activation
                    newActivation[j] = Math.max(0, sum);
                }
            }
            
            activation = newActivation;
        }
        
        // Apply softmax to output for action probabilities
        return this.softmax(activation);
    }
    
    /**
     * Apply softmax activation to output layer
     */
    softmax(arr) {
        const max = Math.max(...arr);
        const exps = arr.map(x => Math.exp(x - max));
        const sumExps = exps.reduce((a, b) => a + b, 0);
        return exps.map(x => x / sumExps);
    }
    
    /**
     * Create a mutated copy of this network
     * @param {number} mutationRate - Probability of mutating each weight/bias
     * @param {number} mutationStrength - Standard deviation of mutation noise
     * @returns {NeuralNetwork} - New mutated network
     */
    mutate(mutationRate, mutationStrength) {
        const newNetwork = new NeuralNetwork(1, [1], 1); // Dummy initialization
        newNetwork.layers = [];
        
        // Deep copy and mutate each layer
        for (const layer of this.layers) {
            const newLayer = {
                weights: layer.weights.map(row => 
                    row.map(w => Math.random() < mutationRate ? 
                        w + this.gaussianRandom() * mutationStrength : w)
                ),
                biases: layer.biases.map(b => Math.random() < mutationRate ? 
                    b + this.gaussianRandom() * mutationStrength : b)
            };
            newNetwork.layers.push(newLayer);
        }
        
        return newNetwork;
    }
    
    /**
     * Create an exact copy of this network
     * @returns {NeuralNetwork} - Cloned network
     */
    clone() {
        const newNetwork = new NeuralNetwork(1, [1], 1); // Dummy initialization
        newNetwork.layers = [];
        
        // Deep copy each layer
        for (const layer of this.layers) {
            const newLayer = {
                weights: layer.weights.map(row => [...row]),
                biases: [...layer.biases]
            };
            newNetwork.layers.push(newLayer);
        }
        
        return newNetwork;
    }
    
    /**
     * Apply REINFORCE learning to adjust network weights
     * @param {number[]} input - Input that led to the action
     * @param {number} actionIndex - Index of action that was taken
     * @param {number} reward - Reward received for the action
     * @param {number} learningRate - Learning rate for weight updates
     */
    applyREINFORCE(input, actionIndex, reward, learningRate = 0.001) {
        if (Math.abs(reward) < 0.01) return; // Skip if reward is negligible
        
        // Simple REINFORCE: adjust the output layer weights
        const outputLayer = this.layers[this.layers.length - 1];
        
        // Nudge weights for the action that was taken
        for (let i = 0; i < outputLayer.weights[actionIndex].length; i++) {
            outputLayer.weights[actionIndex][i] += learningRate * reward * input[i];
        }
        
        // Nudge bias
        outputLayer.biases[actionIndex] += learningRate * reward;
    }
    
    /**
     * Get network architecture information
     * @returns {object} - Network structure details
     */
    getArchitecture() {
        const architecture = {
            layers: this.layers.length,
            structure: [],
            totalParameters: 0
        };
        
        for (const layer of this.layers) {
            const layerInfo = {
                neurons: layer.weights.length,
                inputs: layer.weights[0].length,
                weights: layer.weights.length * layer.weights[0].length,
                biases: layer.biases.length
            };
            layerInfo.parameters = layerInfo.weights + layerInfo.biases;
            architecture.totalParameters += layerInfo.parameters;
            architecture.structure.push(layerInfo);
        }
        
        return architecture;
    }
    
    /**
     * Serialize network to a database-friendly format
     * @returns {object} - Serializable network data
     */
    serialize() {
        return {
            layers: this.layers.map(layer => ({
                weights: layer.weights,
                biases: layer.biases
            })),
            architecture: this.getArchitecture(),
            version: '1.0',
            serializedAt: Date.now()
        };
    }
    
    /**
     * Create network from serialized data
     * @param {object} data - Serialized network data
     * @returns {NeuralNetwork} - Reconstructed network
     */
    static deserialize(data) {
        if (!data.layers || !data.architecture) {
            throw new Error('Invalid serialized network data');
        }
        
        // Extract architecture info
        const structure = data.architecture.structure;
        const inputSize = structure[0].inputs;
        const hiddenSizes = structure.slice(0, -1).map(layer => layer.neurons);
        const outputSize = structure[structure.length - 1].neurons;
        
        // Create network with correct architecture
        const network = new NeuralNetwork(inputSize, hiddenSizes, outputSize);
        
        // Replace with serialized weights and biases
        data.layers.forEach((layerData, index) => {
            if (index < network.layers.length) {
                network.layers[index].weights = layerData.weights.map(row => [...row]);
                network.layers[index].biases = [...layerData.biases];
            }
        });
        
        return network;
    }
    
    /**
     * Calculate network similarity to another network
     * @param {NeuralNetwork} other - Network to compare with
     * @returns {number} - Similarity score (0-1, 1 = identical)
     */
    calculateSimilarity(other) {
        if (this.layers.length !== other.layers.length) {
            return 0;
        }
        
        let totalDifference = 0;
        let totalParameters = 0;
        
        for (let i = 0; i < this.layers.length; i++) {
            const thisLayer = this.layers[i];
            const otherLayer = other.layers[i];
            
            // Compare weights
            for (let j = 0; j < thisLayer.weights.length; j++) {
                for (let k = 0; k < thisLayer.weights[j].length; k++) {
                    totalDifference += Math.abs(thisLayer.weights[j][k] - otherLayer.weights[j][k]);
                    totalParameters++;
                }
            }
            
            // Compare biases
            for (let j = 0; j < thisLayer.biases.length; j++) {
                totalDifference += Math.abs(thisLayer.biases[j] - otherLayer.biases[j]);
                totalParameters++;
            }
        }
        
        const averageDifference = totalDifference / totalParameters;
        return Math.max(0, 1 - averageDifference);
    }
    
    /**
     * Get weight statistics for analysis
     * @returns {object} - Weight distribution statistics
     */
    getWeightStats() {
        let allWeights = [];
        let allBiases = [];
        
        for (const layer of this.layers) {
            for (const row of layer.weights) {
                allWeights.push(...row);
            }
            allBiases.push(...layer.biases);
        }
        
        const calculateStats = (values) => {
            const sorted = values.sort((a, b) => a - b);
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            
            return {
                count: values.length,
                min: sorted[0],
                max: sorted[sorted.length - 1],
                mean: mean,
                std: Math.sqrt(variance),
                median: sorted[Math.floor(sorted.length / 2)]
            };
        };
        
        return {
            weights: calculateStats(allWeights),
            biases: calculateStats(allBiases),
            totalParameters: allWeights.length + allBiases.length
        };
    }
}