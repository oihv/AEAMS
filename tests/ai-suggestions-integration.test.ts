/**
 * Integration Tests for AI Suggestion API
 * 
 * Tests the complete flow from API endpoint to database with real data
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma } from '../lib/prisma'

describe('AI Suggestions Integration Tests', () => {
  let testUser: any
  let testFarm: any
  let testMainRod: any
  let testSecondaryRod: any
  let testReading: any

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test-integration@example.com',
        name: 'Integration Test User'
      }
    })

    // Create test farm
    testFarm = await prisma.farm.create({
      data: {
        name: 'Integration Test Farm',
        location: 'Test Location',
        plantType: 'Tomatoes',
        userId: testUser.id
      }
    })

    // Create test main rod
    testMainRod = await prisma.mainRod.create({
      data: {
        rodId: 'test-main-rod-integration',
        farmId: testFarm.id,
        isConnected: true
      }
    })

    // Create test secondary rod
    testSecondaryRod = await prisma.secondaryRod.create({
      data: {
        rodId: 'test-secondary-rod-integration',
        name: 'Integration Test Rod',
        mainRodId: testMainRod.id,
        isActive: true
      }
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.aISuggestion.deleteMany({
      where: { secondaryRodId: testSecondaryRod.id }
    })
    await prisma.reading.deleteMany({
      where: { secondaryRodId: testSecondaryRod.id }
    })
    await prisma.secondaryRod.deleteMany({
      where: { id: testSecondaryRod.id }
    })
    await prisma.mainRod.deleteMany({
      where: { id: testMainRod.id }
    })
    await prisma.farm.deleteMany({
      where: { id: testFarm.id }
    })
    await prisma.user.deleteMany({
      where: { id: testUser.id }
    })
  })

  beforeEach(async () => {
    // Clean up any existing readings and suggestions
    await prisma.aISuggestion.deleteMany({
      where: { secondaryRodId: testSecondaryRod.id }
    })
    await prisma.reading.deleteMany({
      where: { secondaryRodId: testSecondaryRod.id }
    })
  })

  describe('Database Operations', () => {
    it('should create and retrieve sensor readings', async () => {
      const reading = await prisma.reading.create({
        data: {
          secondaryRodId: testSecondaryRod.id,
          temperature: 22.5,
          moisture: 45.0,
          ph: 6.5,
          conductivity: 1.2,
          nitrogen: 25,
          phosphorus: 15,
          potassium: 60,
          timestamp: new Date()
        }
      })

      expect(reading).toBeDefined()
      expect(reading.temperature).toBe(22.5)
      expect(reading.secondaryRodId).toBe(testSecondaryRod.id)
    })

    it('should create and cache AI suggestions', async () => {
      // Create a reading first
      testReading = await prisma.reading.create({
        data: {
          secondaryRodId: testSecondaryRod.id,
          temperature: 22.5,
          moisture: 45.0,
          ph: 6.5,
          conductivity: 1.2,
          nitrogen: 25,
          phosphorus: 15,
          potassium: 60,
          timestamp: new Date()
        }
      })

      // Create AI suggestion
      const suggestion = {
        watering: {
          recommendation: 'later',
          hoursUntilNext: 24,
          reason: 'Soil moisture is adequate',
          urgency: 'low'
        },
        fertilizing: {
          recommendation: 'later',
          daysUntilNext: 14,
          reason: 'Nutrient levels are good',
          type: 'balanced',
          urgency: 'low'
        },
        plantHealth: {
          score: 85,
          status: 'good',
          concerns: []
        }
      }

      const aiSuggestion = await prisma.aISuggestion.create({
        data: {
          readingId: testReading.id,
          secondaryRodId: testSecondaryRod.id,
          plantType: 'Tomatoes',
          model: 'rule_based',
          suggestion: suggestion
        }
      })

      expect(aiSuggestion).toBeDefined()
      expect(aiSuggestion.readingId).toBe(testReading.id)
      expect(aiSuggestion.plantType).toBe('Tomatoes')
      expect(aiSuggestion.model).toBe('rule_based')
    })

    it('should retrieve cached suggestions', async () => {
      // Create reading and suggestion
      testReading = await prisma.reading.create({
        data: {
          secondaryRodId: testSecondaryRod.id,
          temperature: 22.5,
          moisture: 45.0,
          ph: 6.5,
          timestamp: new Date()
        }
      })

      const originalSuggestion = {
        watering: { recommendation: 'now', hoursUntilNext: 0, reason: 'Test', urgency: 'high' },
        fertilizing: { recommendation: 'later', daysUntilNext: 7, reason: 'Test', type: 'balanced', urgency: 'low' },
        plantHealth: { score: 75, status: 'good', concerns: [] }
      }

      await prisma.aISuggestion.create({
        data: {
          readingId: testReading.id,
          secondaryRodId: testSecondaryRod.id,
          plantType: 'Tomatoes',
          model: 'rule_based',
          suggestion: originalSuggestion
        }
      })

      // Retrieve the cached suggestion
      const cachedSuggestion = await prisma.aISuggestion.findUnique({
        where: { readingId: testReading.id }
      })

      expect(cachedSuggestion).toBeDefined()
      expect(cachedSuggestion!.suggestion).toEqual(originalSuggestion)
    })

    it('should handle multiple suggestions for different readings', async () => {
      // Create two different readings
      const reading1 = await prisma.reading.create({
        data: {
          secondaryRodId: testSecondaryRod.id,
          temperature: 20.0,
          moisture: 30.0,
          timestamp: new Date()
        }
      })

      const reading2 = await prisma.reading.create({
        data: {
          secondaryRodId: testSecondaryRod.id,
          temperature: 25.0,
          moisture: 70.0,
          timestamp: new Date()
        }
      })

      // Create suggestions for both
      const suggestion1 = {
        watering: { recommendation: 'now', hoursUntilNext: 0, reason: 'Low moisture', urgency: 'high' },
        fertilizing: { recommendation: 'later', daysUntilNext: 7, reason: 'OK', type: 'balanced', urgency: 'low' },
        plantHealth: { score: 60, status: 'fair', concerns: ['Water stress'] }
      }

      const suggestion2 = {
        watering: { recommendation: 'not_needed', hoursUntilNext: 48, reason: 'High moisture', urgency: 'low' },
        fertilizing: { recommendation: 'later', daysUntilNext: 7, reason: 'OK', type: 'balanced', urgency: 'low' },
        plantHealth: { score: 80, status: 'good', concerns: [] }
      }

      await prisma.aISuggestion.create({
        data: {
          readingId: reading1.id,
          secondaryRodId: testSecondaryRod.id,
          plantType: 'Tomatoes',
          model: 'rule_based',
          suggestion: suggestion1
        }
      })

      await prisma.aISuggestion.create({
        data: {
          readingId: reading2.id,
          secondaryRodId: testSecondaryRod.id,
          plantType: 'Tomatoes',
          model: 'rule_based',
          suggestion: suggestion2
        }
      })

      // Verify both suggestions exist and are different
      const cached1 = await prisma.aISuggestion.findUnique({
        where: { readingId: reading1.id }
      })

      const cached2 = await prisma.aISuggestion.findUnique({
        where: { readingId: reading2.id }
      })

      expect(cached1).toBeDefined()
      expect(cached2).toBeDefined()
      expect(cached1!.suggestion).toEqual(suggestion1)
      expect(cached2!.suggestion).toEqual(suggestion2)
    })
  })

  describe('Service Integration', () => {
    it('should work with the AISuggestionService cache flow', async () => {
      const { AISuggestionService } = await import('../lib/ai-suggestions')

      // Create a reading
      testReading = await prisma.reading.create({
        data: {
          secondaryRodId: testSecondaryRod.id,
          temperature: 22.5,
          moisture: 50.0,
          ph: 6.5,
          nitrogen: 25,
          phosphorus: 15,
          potassium: 60,
          timestamp: new Date()
        }
      })

      const readingWithId = {
        id: testReading.id,
        temperature: testReading.temperature,
        moisture: testReading.moisture,
        ph: testReading.ph,
        conductivity: testReading.conductivity,
        nitrogen: testReading.nitrogen,
        phosphorus: testReading.phosphorus,
        potassium: testReading.potassium,
        timestamp: testReading.timestamp
      }

      // First call - should generate and cache
      const result1 = await AISuggestionService.getOrCreateSuggestions(
        readingWithId,
        testSecondaryRod.id,
        'Tomatoes'
      )

      expect(result1).toBeDefined()
      expect(result1.cached).toBe(false) // First call, not cached
      expect(result1.watering).toBeDefined()
      expect(result1.fertilizing).toBeDefined()
      expect(result1.plantHealth).toBeDefined()

      // Second call - should return cached result
      const result2 = await AISuggestionService.getOrCreateSuggestions(
        readingWithId,
        testSecondaryRod.id,
        'Tomatoes'
      )

      expect(result2).toBeDefined()
      expect(result2.cached).toBe(true) // Second call, should be cached
      expect(result2.watering).toEqual(result1.watering)
      expect(result2.fertilizing).toEqual(result1.fertilizing)
      expect(result2.plantHealth).toEqual(result1.plantHealth)
    })
  })
})