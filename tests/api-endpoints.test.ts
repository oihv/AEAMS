/**
 * API Endpoint Integration Tests
 * Tests the actual HTTP endpoints to ensure they properly integrate with the AI suggestions service
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawn, ChildProcess } from 'child_process'
import fetch from 'node-fetch'

describe('AI Suggestions API Endpoints', () => {
  let server: ChildProcess
  let serverReady = false
  const baseUrl = 'http://localhost:3002'

  beforeAll(async () => {
    // Start the Next.js server on a different port for testing
    server = spawn('npm', ['run', 'dev'], {
      env: { ...process.env, PORT: '3002' },
      stdio: 'pipe'
    })

    // Wait for server to be ready
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server failed to start within 30 seconds'))
      }, 30000)

      server.stdout?.on('data', (data) => {
        const output = data.toString()
        if (output.includes('Ready in') || output.includes('✓ Ready')) {
          serverReady = true
          clearTimeout(timeout)
          // Give it a moment to fully initialize
          setTimeout(resolve, 2000)
        }
      })

      server.stderr?.on('data', (data) => {
        console.error('Server error:', data.toString())
      })

      server.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })
  }, 45000)

  afterAll(async () => {
    if (server) {
      server.kill('SIGTERM')
      // Give it time to clean up
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  })

  it('should respond to test-rod endpoint with AI suggestions', async () => {
    if (!serverReady) {
      throw new Error('Server not ready')
    }

    const testData = {
      plantType: 'Tomato',
      rodData: {
        readings: [{
          temperature: 25.5,
          moisture: 45.2,
          ph: 6.8,
          conductivity: 1200,
          nitrogen: 150,
          phosphorus: 45,
          potassium: 180,
          timestamp: '2024-01-15T10:30:00Z'
        }]
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(`${baseUrl}/api/ai-suggestions/test-rod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      
      expect(response.status).toBe(200)
      
      const data = await response.json() as any
      
      // Validate response structure
      expect(data).toHaveProperty('watering')
      expect(data).toHaveProperty('fertilizing')
      expect(data).toHaveProperty('healthScore')
      expect(data).toHaveProperty('urgency')
      expect(data).toHaveProperty('modelType')
      
      // Validate content
      expect(typeof data.healthScore).toBe('number')
      expect(data.healthScore).toBeGreaterThanOrEqual(0)
      expect(data.healthScore).toBeLessThanOrEqual(100)
      
      expect(['low', 'medium', 'high']).toContain(data.urgency)
      expect(['rule_based', 'deepseek']).toContain(data.modelType)
      
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 10 seconds')
      }
      throw error
    }
  }, 15000)

  it('should handle invalid requests properly', async () => {
    if (!serverReady) {
      throw new Error('Server not ready')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`${baseUrl}/api/ai-suggestions/test-rod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}), // Invalid data
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      expect(response.status).toBe(400)
      
      const data = await response.json() as any
      expect(data).toHaveProperty('error')
      
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 5 seconds')
      }
      throw error
    }
  }, 10000)

  it('should return proper health check response', async () => {
    if (!serverReady) {
      throw new Error('Server not ready')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      expect(response.status).toBe(200)
      
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Health check timed out after 5 seconds')
      }
      throw error
    }
  }, 10000)
})