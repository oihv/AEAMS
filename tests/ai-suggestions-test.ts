/**
 * AI Suggestions Quality Test Suite
 * 
 * This script tests the AI suggestion system with various scenarios
 * to evaluate the quality and accuracy of recommendations.
 */

export interface TestScenario {
  id: string;
  name: string;
  plantType: string;
  rodData: {
    readings: Array<{
      temperature: number;
      moisture: number;
      ph: number;
      conductivity: number;
      nitrogen: number;
      phosphorus: number;
      potassium: number;
      timestamp: string;
    }>;
  };
  expectedSuggestions: {
    watering: {
      urgency: 'low' | 'medium' | 'high' | 'critical';
      shouldContain: string[];
    };
    fertilizing: {
      urgency: 'low' | 'medium' | 'high' | 'critical';
      shouldContain: string[];
    };
    healthScore: string; // e.g., "range:30-50"
  };
}

export const scenarios: TestScenario[] = [
  {
    id: 'tomato-dry-low-nutrients',
    name: 'Tomato Plant - Dry Soil, Low Nutrients',
    plantType: 'Tomatoes',
    rodData: {
      readings: [{
        temperature: 24.5,
        moisture: 15.2,      // Very low - needs water
        ph: 6.8,             // Good for tomatoes
        conductivity: 0.8,   // Low - needs nutrients
        nitrogen: 12,        // Low for tomatoes
        phosphorus: 8,       // Low for flowering
        potassium: 45,       // Decent but could be higher
        timestamp: new Date().toISOString()
      }]
    },
    expectedSuggestions: {
      watering: {
        urgency: 'high',
        shouldContain: ['water immediately', 'moisture is low', '15%']
      },
      fertilizing: {
        urgency: 'high', 
        shouldContain: ['nitrogen', 'phosphorus', 'flowering', 'fruit development']
      },
      healthScore: 'range:30-50' // Poor due to dry conditions
    }
  },

  {
    id: 'lettuce-optimal-conditions',
    name: 'Lettuce - Optimal Growing Conditions',
    plantType: 'Lettuce',
    rodData: {
      readings: [{
        temperature: 18.0,   // Perfect for lettuce
        moisture: 65.0,      // Good moisture
        ph: 6.2,             // Optimal for lettuce
        conductivity: 1.4,   // Good nutrient levels
        nitrogen: 35,        // High - good for leafy greens
        phosphorus: 15,      // Adequate
        potassium: 85,       // Good
        timestamp: new Date().toISOString()
      }]
    },
    expectedSuggestions: {
      watering: {
        urgency: 'low',
        shouldContain: ['moisture levels good', 'maintain', 'monitor']
      },
      fertilizing: {
        urgency: 'low',
        shouldContain: ['adequate', 'maintain', 'nitrogen levels good']
      },
      healthScore: 'range:80-95' // Excellent conditions
    }
  },

  {
    id: 'corn-hot-overwatered',
    name: 'Corn - Hot Weather, Overwatered',
    plantType: 'Corn',
    rodData: {
      readings: [{
        temperature: 32.5,   // Hot
        moisture: 85.0,      // Too wet
        ph: 7.2,             // Slightly high for corn
        conductivity: 2.1,   // High - possibly salt buildup
        nitrogen: 28,        // Good for corn
        phosphorus: 18,      // Good
        potassium: 95,       // Good
        timestamp: new Date().toISOString()
      }]
    },
    expectedSuggestions: {
      watering: {
        urgency: 'low',
        shouldContain: ['reduce watering', 'overwatered', 'drainage', '85%']
      },
      fertilizing: {
        urgency: 'medium',
        shouldContain: ['salt buildup', 'flush', 'reduce fertilizer']
      },
      healthScore: 'range:40-65' // Stressed from overwatering
    }
  },

  {
    id: 'carrots-acidic-soil',
    name: 'Carrots - Acidic Soil, Cold Temperature',
    plantType: 'Carrots',
    rodData: {
      readings: [{
        temperature: 12.0,   // Cool - acceptable for carrots
        moisture: 45.0,      // Moderate
        ph: 5.2,             // Too acidic
        conductivity: 1.0,   // Moderate
        nitrogen: 8,         // Low - but carrots don't need much
        phosphorus: 25,      // High - good for root development
        potassium: 65,       // Good
        timestamp: new Date().toISOString()
      }]
    },
    expectedSuggestions: {
      watering: {
        urgency: 'medium',
        shouldContain: ['moderate', 'maintain', 'slight increase']
      },
      fertilizing: {
        urgency: 'high',
        shouldContain: ['pH too low', 'lime', 'acidic', 'raise pH']
      },
      healthScore: 'range:50-70' // Limited by pH issues
    }
  },

  {
    id: 'peppers-nutrient-deficient',
    name: 'Peppers - Severe Nutrient Deficiency',
    plantType: 'Peppers',
    rodData: {
      readings: [{
        temperature: 26.0,   // Good for peppers
        moisture: 55.0,      // Adequate
        ph: 6.5,             // Perfect for peppers
        conductivity: 0.3,   // Very low - severe nutrient deficiency
        nitrogen: 3,         // Critically low
        phosphorus: 2,       // Critically low
        potassium: 15,       // Very low
        timestamp: new Date().toISOString()
      }]
    },
    expectedSuggestions: {
      watering: {
        urgency: 'medium',
        shouldContain: ['adequate', 'maintain', 'monitor']
      },
      fertilizing: {
        urgency: 'critical',
        shouldContain: ['severe deficiency', 'immediate', 'balanced fertilizer', 'all nutrients low']
      },
      healthScore: 'range:20-40' // Very poor due to nutrient deficiency
    }
  },

  {
    id: 'herbs-winter-conditions',
    name: 'Herbs - Winter Indoor Growing',
    plantType: 'Herbs',
    rodData: {
      readings: [{
        temperature: 16.0,   // Cool but acceptable indoors
        moisture: 38.0,      // Slightly dry
        ph: 6.8,             // Good for most herbs
        conductivity: 0.9,   // Moderate
        nitrogen: 18,        // Moderate - herbs don't need much
        phosphorus: 12,      // Adequate
        potassium: 55,       // Good
        timestamp: new Date().toISOString()
      }]
    },
    expectedSuggestions: {
      watering: {
        urgency: 'medium',
        shouldContain: ['slightly dry', 'increase watering', 'herbs prefer']
      },
      fertilizing: {
        urgency: 'low',
        shouldContain: ['light feeding', 'herbs', 'winter growth']
      },
      healthScore: 'range:65-80' // Good for winter herbs
    }
  }
];

export interface EvaluationResult {
  watering: { score: number; feedback: string };
  fertilizing: { score: number; feedback: string };
  healthScore: { score: number; feedback: string };
  overall: { score: number; status: string };
}

/**
 * API endpoint for testing
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function testScenario(scenario: TestScenario): Promise<EvaluationResult | { error: string }> {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📊 Plant Type: ${scenario.plantType}`);
  
  try {
    // Call the actual AI suggestions API
    const response = await fetch(`${API_BASE}/api/ai-suggestions/test-rod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plantType: scenario.plantType,
        rodData: scenario.rodData,
        testMode: true
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const suggestions = await response.json();
    
    // Evaluate suggestions
    const evaluation = evaluateSuggestions(suggestions, scenario.expectedSuggestions);
    
    console.log(`📋 Results:`);
    console.log(`   Watering: ${evaluation.watering.score}/10 - ${evaluation.watering.feedback}`);
    console.log(`   Fertilizing: ${evaluation.fertilizing.score}/10 - ${evaluation.fertilizing.feedback}`);
    console.log(`   Health Score: ${evaluation.healthScore.score}/10 - ${evaluation.healthScore.feedback}`);
    console.log(`   Overall: ${evaluation.overall.score}/10 - ${evaluation.overall.status}`);
    
    return evaluation;
    
  } catch (error) {
    console.log(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export function evaluateSuggestions(actual: any, expected: TestScenario['expectedSuggestions']): EvaluationResult {
  const watering = evaluateCategory(actual.watering, expected.watering);
  const fertilizing = evaluateCategory(actual.fertilizing, expected.fertilizing);
  const healthScore = evaluateHealthScore(actual.healthScore, expected.healthScore);
  
  // Calculate overall score
  const scores = [watering.score, fertilizing.score, healthScore.score];
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  const overall = {
    score: Math.round(avgScore),
    status: avgScore >= 8 ? 'Excellent' : avgScore >= 6 ? 'Good' : avgScore >= 4 ? 'Needs Improvement' : 'Poor'
  };
  
  return {
    watering,
    fertilizing,
    healthScore,
    overall
  };
}

function evaluateCategory(actual: { urgency: string; suggestion: string }, expected: { urgency: string; shouldContain: string[] }) {
  let score = 0;
  const feedback = [];
  
  // Check urgency level
  if (actual.urgency === expected.urgency) {
    score += 4;
    feedback.push('✅ Urgency level correct');
  } else {
    feedback.push(`❌ Expected urgency: ${expected.urgency}, got: ${actual.urgency}`);
  }
  
  // Check content keywords
  const actualText = actual.suggestion.toLowerCase();
  const matchedKeywords = expected.shouldContain.filter(keyword => 
    actualText.includes(keyword.toLowerCase())
  );
  
  const keywordScore = (matchedKeywords.length / expected.shouldContain.length) * 6;
  score += keywordScore;
  
  feedback.push(`✅ Matched ${matchedKeywords.length}/${expected.shouldContain.length} key concepts`);
  if (matchedKeywords.length < expected.shouldContain.length) {
    const missing = expected.shouldContain.filter(keyword => 
      !actualText.includes(keyword.toLowerCase())
    );
    feedback.push(`❌ Missing concepts: ${missing.join(', ')}`);
  }
  
  return {
    score: Math.round(score),
    feedback: feedback.join(' | ')
  };
}

function evaluateHealthScore(actual: number, expected: string) {
  if (expected.startsWith('range:')) {
    const [min, max] = expected.replace('range:', '').split('-').map(Number);
    const inRange = actual >= min && actual <= max;
    
    return {
      score: inRange ? 10 : Math.max(0, 10 - Math.abs(actual - ((min + max) / 2)) / 10),
      feedback: inRange ? 
        `✅ Health score ${actual} in expected range ${min}-${max}` :
        `❌ Health score ${actual} outside expected range ${min}-${max}`
    };
  }
  
  return { score: 5, feedback: 'Unable to evaluate health score' };
}

/**
 * Manual Test Runner
 */
export async function runAllTests(): Promise<void> {
  console.log('🚀 Starting AI Suggestions Quality Tests\n');
  console.log('='.repeat(50));
  
  const results: Array<{ scenario: string } & (EvaluationResult | { error: string })> = [];
  
  for (const scenario of scenarios) {
    const result = await testScenario(scenario);
    results.push({ scenario: scenario.name, ...result });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
  
  // Summary Report
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY REPORT');
  console.log('='.repeat(50));
  
  const validResults = results.filter((r): r is { scenario: string } & EvaluationResult => !('error' in r));
  if (validResults.length === 0) {
    console.log('❌ No valid test results');
    return;
  }
  
  const avgOverall = validResults.reduce((sum, r) => sum + r.overall.score, 0) / validResults.length;
  
  console.log(`\n📈 Overall AI Quality Score: ${avgOverall.toFixed(1)}/10`);
  console.log(`📊 Tests Completed: ${validResults.length}/${scenarios.length}`);
  
  console.log('\n🎯 Individual Test Results:');
  validResults.forEach(result => {
    console.log(`   ${result.scenario}: ${result.overall.score}/10 (${result.overall.status})`);
  });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (avgOverall >= 8) {
    console.log('   ✅ AI suggestions are performing excellently');
  } else if (avgOverall >= 6) {
    console.log('   ⚠️ AI suggestions are good but have room for improvement');
    console.log('   📝 Consider fine-tuning prompts for edge cases');
  } else {
    console.log('   ❌ AI suggestions need significant improvement');
    console.log('   🔧 Review AI prompts and training data');
    console.log('   🎯 Focus on urgency detection and plant-specific knowledge');
  }
}