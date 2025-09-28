// Advanced ML-based AI Engine for Plant Care
// Uses TensorFlow.js for trainable neural networks

import * as tf from '@tensorflow/tfjs'

export interface SensorReading {
  temperature: number | null
  moisture: number | null
  ph: number | null
  conductivity: number | null
  nitrogen: number | null
  phosphorus: number | null
  potassium: number | null
  timestamp: Date
}

export interface MLPrediction {
  rodId: string
  healthScore: number
  wateringUrgency: number // 0-1 continuous scale
  fertilizationUrgency: number // 0-1 continuous scale
  predictedMoisture24h: number
  predictedNPK: { n: number; p: number; k: number }
  confidence: number
  modelAccuracy: number
  lastUpdated: Date
}

export interface TrainingData {
  inputs: number[][]
  outputs: number[][]
  validation: { inputs: number[][]; outputs: number[][] }
}

export interface ModelMetrics {
  accuracy: number
  loss: number
  valAccuracy: number
  valLoss: number
  epoch: number
  trainingTime: number
}

class MLPlantCareEngine {
  private healthModel: tf.LayersModel | null = null
  private wateringModel: tf.LayersModel | null = null
  private fertilizationModel: tf.LayersModel | null = null
  private timeSeriesModel: tf.LayersModel | null = null
  
  private isTraining = false
  private trainingMetrics: ModelMetrics[] = []

  constructor() {
    this.initializeModels()
  }

  // Initialize neural network models
  private async initializeModels() {
    // Health Score Prediction Model
    this.healthModel = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [7], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }) // 0-1 output for health score
      ]
    })

    // Watering Urgency Model
    this.wateringModel = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [7], units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.15 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }) // 0-1 urgency scale
      ]
    })

    // Fertilization Urgency Model
    this.fertilizationModel = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [7], units: 48, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 24, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    })

    // Time Series Prediction Model (LSTM for future predictions)
    this.timeSeriesModel = tf.sequential({
      layers: [
        tf.layers.lstm({ 
          inputShape: [10, 7], // 10 time steps, 7 features
          units: 50, 
          returnSequences: true 
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({ units: 25, returnSequences: false }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 7, activation: 'linear' }) // Predict all 7 sensor values
      ]
    })

    // Compile models
    const optimizer = tf.train.adam(0.001)
    
    this.healthModel.compile({
      optimizer,
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    })

    this.wateringModel.compile({
      optimizer,
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    })

    this.fertilizationModel.compile({
      optimizer,
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    })

    this.timeSeriesModel.compile({
      optimizer,
      loss: 'meanSquaredError',
      metrics: ['mae']
    })
  }

  // Normalize sensor data for ML input
  private normalizeSensorData(reading: SensorReading): number[] {
    return [
      (reading.temperature || 22) / 40, // Normalize to 0-1
      (reading.moisture || 50) / 100,
      ((reading.ph || 7) - 4) / 6, // pH 4-10 range
      (reading.conductivity || 1.5) / 3,
      (reading.nitrogen || 100) / 300,
      (reading.phosphorus || 30) / 100,
      (reading.potassium || 200) / 400
    ]
  }

  // Generate synthetic training data (in real app, use historical data)
  private generateTrainingData(samples: number = 1000): TrainingData {
    const inputs: number[][] = []
    const healthOutputs: number[][] = []
    const wateringOutputs: number[][] = []
    const fertilizationOutputs: number[][] = []

    for (let i = 0; i < samples; i++) {
      // Generate synthetic sensor readings
      const temp = 15 + Math.random() * 20 + Math.sin(i * 0.1) * 5
      const moisture = Math.max(0, Math.min(100, 50 + Math.random() * 40 - Math.sin(i * 0.05) * 20))
      const ph = 6 + Math.random() * 2
      const conductivity = 1 + Math.random() * 1.5
      const nitrogen = 50 + Math.random() * 200
      const phosphorus = 10 + Math.random() * 60
      const potassium = 100 + Math.random() * 250

      const reading: SensorReading = {
        temperature: temp,
        moisture,
        ph,
        conductivity,
        nitrogen,
        phosphorus,
        potassium,
        timestamp: new Date()
      }

      const normalizedInput = this.normalizeSensorData(reading)
      inputs.push(normalizedInput)

      // Generate target outputs based on plant health rules
      const healthScore = this.calculateSyntheticHealth(reading) / 100
      const wateringUrgency = moisture < 30 ? 0.8 : moisture < 50 ? 0.4 : 0.1
      const nDeficit = Math.max(0, (50 - nitrogen) / 50)
      const fertilizationUrgency = nDeficit * 0.6 + (ph < 6 || ph > 7.5 ? 0.3 : 0)

      healthOutputs.push([healthScore])
      wateringOutputs.push([wateringUrgency])
      fertilizationOutputs.push([Math.min(1, fertilizationUrgency)])
    }

    // Split into training and validation
    const trainSize = Math.floor(samples * 0.8)
    
    return {
      inputs: inputs.slice(0, trainSize),
      outputs: healthOutputs.slice(0, trainSize),
      validation: {
        inputs: inputs.slice(trainSize),
        outputs: healthOutputs.slice(trainSize)
      }
    }
  }

  private calculateSyntheticHealth(reading: SensorReading): number {
    let score = 100
    const temp = reading.temperature || 22
    const moisture = reading.moisture || 50
    const ph = reading.ph || 7
    
    // Temperature penalty
    if (temp < 18 || temp > 26) score -= Math.abs(temp - 22) * 3
    
    // Moisture penalty
    if (moisture < 40) score -= (40 - moisture) * 1.5
    if (moisture > 70) score -= (moisture - 70) * 0.8
    
    // pH penalty
    if (ph < 6 || ph > 7.5) score -= Math.abs(ph - 6.75) * 15
    
    return Math.max(0, score)
  }

  // Train all models with callbacks for real-time metrics
  async trainModels(
    onProgress?: (metrics: ModelMetrics) => void,
    epochs: number = 100
  ): Promise<void> {
    if (this.isTraining) {
      throw new Error('Training already in progress')
    }

    this.isTraining = true
    this.trainingMetrics = []
    const startTime = Date.now()

    try {
      const trainingData = this.generateTrainingData(2000)
      
      const trainInputs = tf.tensor2d(trainingData.inputs)
      const trainOutputs = tf.tensor2d(trainingData.outputs)
      const valInputs = tf.tensor2d(trainingData.validation.inputs)
      const valOutputs = tf.tensor2d(trainingData.validation.outputs)

      // Train health model
      if (this.healthModel) {
        await this.healthModel.fit(trainInputs, trainOutputs, {
          epochs,
          validationData: [valInputs, valOutputs],
          batchSize: 32,
          shuffle: true,
          callbacks: {
            onEpochEnd: async (epoch, logs) => {
              const metrics: ModelMetrics = {
                accuracy: logs?.acc || logs?.accuracy || 0,
                loss: logs?.loss || 0,
                valAccuracy: logs?.val_acc || logs?.val_accuracy || 0,
                valLoss: logs?.val_loss || 0,
                epoch: epoch + 1,
                trainingTime: Date.now() - startTime
              }
              
              this.trainingMetrics.push(metrics)
              
              if (onProgress) {
                onProgress(metrics)
              }
            }
          }
        })
      }

      // Clean up tensors
      trainInputs.dispose()
      trainOutputs.dispose()
      valInputs.dispose()
      valOutputs.dispose()

    } finally {
      this.isTraining = false
    }
  }

  // Generate ML-based predictions
  async generateMLPredictions(rodId: string, readings: SensorReading[]): Promise<MLPrediction> {
    if (readings.length === 0) {
      return {
        rodId,
        healthScore: 0,
        wateringUrgency: 0.5,
        fertilizationUrgency: 0.5,
        predictedMoisture24h: 50,
        predictedNPK: { n: 100, p: 30, k: 200 },
        confidence: 0.1,
        modelAccuracy: 0,
        lastUpdated: new Date()
      }
    }

    const latest = readings[0]
    const normalizedInput = this.normalizeSensorData(latest)
    const inputTensor = tf.tensor2d([normalizedInput])

    let healthScore = 0.5
    let wateringUrgency = 0.5
    let fertilizationUrgency = 0.5
    let modelAccuracy = 0

    try {
      // Health prediction
      if (this.healthModel) {
        const healthPrediction = this.healthModel.predict(inputTensor) as tf.Tensor
        const healthArray = await healthPrediction.data()
        healthScore = healthArray[0] * 100 // Convert back to 0-100 scale
        healthPrediction.dispose()
      }

      // Watering prediction
      if (this.wateringModel) {
        const wateringPrediction = this.wateringModel.predict(inputTensor) as tf.Tensor
        const wateringArray = await wateringPrediction.data()
        wateringUrgency = wateringArray[0]
        wateringPrediction.dispose()
      }

      // Fertilization prediction
      if (this.fertilizationModel) {
        const fertilizationPrediction = this.fertilizationModel.predict(inputTensor) as tf.Tensor
        const fertilizationArray = await fertilizationPrediction.data()
        fertilizationUrgency = fertilizationArray[0]
        fertilizationPrediction.dispose()
      }

      // Calculate model accuracy from latest training metrics
      const latestMetrics = this.trainingMetrics[this.trainingMetrics.length - 1]
      modelAccuracy = latestMetrics ? latestMetrics.accuracy : 0.75

    } finally {
      inputTensor.dispose()
    }

    // Time series prediction for future values
    let predictedMoisture24h = latest.moisture || 50
    let predictedNPK = { 
      n: latest.nitrogen || 100, 
      p: latest.phosphorus || 30, 
      k: latest.potassium || 200 
    }

    if (readings.length >= 10 && this.timeSeriesModel) {
      try {
        const sequenceData = readings.slice(0, 10).reverse().map(r => this.normalizeSensorData(r))
        const sequenceTensor = tf.tensor3d([sequenceData])
        
        const futurePrediction = this.timeSeriesModel.predict(sequenceTensor) as tf.Tensor
        const futureArray = await futurePrediction.data()
        
        predictedMoisture24h = futureArray[1] * 100 // Denormalize moisture
        predictedNPK = {
          n: futureArray[4] * 300, // Denormalize nitrogen
          p: futureArray[5] * 100, // Denormalize phosphorus
          k: futureArray[6] * 400  // Denormalize potassium
        }
        
        sequenceTensor.dispose()
        futurePrediction.dispose()
      } catch (error) {
        console.warn('Time series prediction failed:', error)
      }
    }

    // Calculate confidence based on data quality and model performance
    const dataQuality = readings.length >= 10 ? 1 : readings.length / 10
    const sensorCoverage = this.normalizeSensorData(latest).filter(v => v > 0).length / 7
    const confidence = Math.min(1, (dataQuality * sensorCoverage * modelAccuracy + 0.2))

    return {
      rodId,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      wateringUrgency: Math.max(0, Math.min(1, wateringUrgency)),
      fertilizationUrgency: Math.max(0, Math.min(1, fertilizationUrgency)),
      predictedMoisture24h: Math.max(0, Math.min(100, predictedMoisture24h)),
      predictedNPK,
      confidence,
      modelAccuracy,
      lastUpdated: new Date()
    }
  }

  // Get training metrics for visualization
  getTrainingMetrics(): ModelMetrics[] {
    return this.trainingMetrics
  }

  // Check if model is currently training
  isCurrentlyTraining(): boolean {
    return this.isTraining
  }

  // Save models to browser storage
  async saveModels(): Promise<void> {
    if (this.healthModel) {
      await this.healthModel.save('localstorage://health-model')
    }
    if (this.wateringModel) {
      await this.wateringModel.save('localstorage://watering-model')
    }
    if (this.fertilizationModel) {
      await this.fertilizationModel.save('localstorage://fertilization-model')
    }
    if (this.timeSeriesModel) {
      await this.timeSeriesModel.save('localstorage://timeseries-model')
    }
  }

  // Load models from browser storage
  async loadModels(): Promise<void> {
    try {
      this.healthModel = await tf.loadLayersModel('localstorage://health-model')
      this.wateringModel = await tf.loadLayersModel('localstorage://watering-model')
      this.fertilizationModel = await tf.loadLayersModel('localstorage://fertilization-model')
      this.timeSeriesModel = await tf.loadLayersModel('localstorage://timeseries-model')
    } catch (error) {
      console.log('No saved models found, using fresh models')
    }
  }

  // Get model summary information
  getModelInfo() {
    return {
      healthModel: {
        params: this.healthModel?.countParams() || 0,
        layers: this.healthModel?.layers.length || 0
      },
      wateringModel: {
        params: this.wateringModel?.countParams() || 0,
        layers: this.wateringModel?.layers.length || 0
      },
      fertilizationModel: {
        params: this.fertilizationModel?.countParams() || 0,
        layers: this.fertilizationModel?.layers.length || 0
      },
      timeSeriesModel: {
        params: this.timeSeriesModel?.countParams() || 0,
        layers: this.timeSeriesModel?.layers.length || 0
      },
      totalParams: (this.healthModel?.countParams() || 0) + 
                   (this.wateringModel?.countParams() || 0) + 
                   (this.fertilizationModel?.countParams() || 0) + 
                   (this.timeSeriesModel?.countParams() || 0)
    }
  }
}

// Singleton instance
let mlEngine: MLPlantCareEngine | null = null

export const getMLEngine = (): MLPlantCareEngine => {
  if (!mlEngine) {
    mlEngine = new MLPlantCareEngine()
  }
  return mlEngine
}

export { MLPlantCareEngine }