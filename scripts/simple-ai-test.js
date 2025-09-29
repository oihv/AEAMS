/**
 * Simple AI Suggestions Test Runner
 * 
 * Tests AI suggestion quality by calling the API endpoints directly
 */

const scenarios = [
  {
    id: 'tomato-dry-low-nutrients',
    name: 'Tomato Plant - Dry Soil, Low Nutrients',
    plantType: 'Tomatoes',
    reading: {
      temperature: 24.5,
      moisture: 15.2,
      ph: 6.8,
      conductivity: 0.8,
      nitrogen: 12,
      phosphorus: 8,
      potassium: 45,
      timestamp: new Date()
    },
    expected: {
      watering: { urgency: 'high', keywords: ['water immediately', 'moisture is low', '15'] },
      fertilizing: { urgency: 'high', keywords: ['nitrogen', 'phosphorus', 'flowering'] },
      healthRange: [50, 70] // Adjusted for improved health scoring
    }
  },
  {
    id: 'lettuce-optimal-conditions',
    name: 'Lettuce - Optimal Growing Conditions',
    plantType: 'Lettuce',
    reading: {
      temperature: 18.0,
      moisture: 65.0,
      ph: 6.2,
      conductivity: 1.4,
      nitrogen: 35,
      phosphorus: 15,
      potassium: 85,
      timestamp: new Date()
    },
    expected: {
      watering: { urgency: 'low', keywords: ['moisture levels good', 'maintain', 'monitor'] },
      fertilizing: { urgency: 'low', keywords: ['adequate', 'maintain', 'nitrogen levels good'] },
      healthRange: [90, 100] // Adjusted for optimal conditions bonus scoring
    }
  }
];

async function testScenario(scenario, apiBase = 'http://localhost:3000') {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📊 Plant Type: ${scenario.plantType}`);
  
  try {
    const response = await fetch(`${apiBase}/api/ai-suggestions/test-rod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plantType: scenario.plantType,
        rodData: { readings: [scenario.reading] }
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} - ${await response.text()}`);
    }

    const suggestions = await response.json();
    
    // Simple evaluation
    console.log(`📋 AI Suggestions:`);
    console.log(`   Watering: ${suggestions.watering.urgency} - "${suggestions.watering.reason}"`);
    console.log(`   Fertilizing: ${suggestions.fertilizing.urgency} - "${suggestions.fertilizing.reason}"`);
    console.log(`   Health Score: ${suggestions.plantHealth.score}`);
    
    // Check expectations
    const wateringMatch = suggestions.watering.urgency === scenario.expected.watering.urgency;
    const fertilizingMatch = suggestions.fertilizing.urgency === scenario.expected.fertilizing.urgency;
    const healthInRange = suggestions.plantHealth.score >= scenario.expected.healthRange[0] && 
                         suggestions.plantHealth.score <= scenario.expected.healthRange[1];
    
    console.log(`\n✅ Evaluation:`);
    console.log(`   Watering Urgency: ${wateringMatch ? '✅ PASS' : '❌ FAIL'} (Expected: ${scenario.expected.watering.urgency})`);
    console.log(`   Fertilizing Urgency: ${fertilizingMatch ? '✅ PASS' : '❌ FAIL'} (Expected: ${scenario.expected.fertilizing.urgency})`);
    console.log(`   Health Score Range: ${healthInRange ? '✅ PASS' : '❌ FAIL'} (Expected: ${scenario.expected.healthRange[0]}-${scenario.expected.healthRange[1]})`);
    
    return { wateringMatch, fertilizingMatch, healthInRange, suggestions };
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return { error: error.message };
  }
}

async function runAllTests(apiBase = 'http://localhost:3000') {
  console.log('🚀 Starting AI Suggestions Quality Tests');
  console.log('=' .repeat(50));
  
  const results = [];
  
  for (const scenario of scenarios) {
    const result = await testScenario(scenario, apiBase);
    results.push({ scenario: scenario.name, ...result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY REPORT');
  console.log('='.repeat(50));
  
  const validResults = results.filter(r => !r.error);
  const totalTests = validResults.length * 3; // 3 checks per test
  const passedTests = validResults.reduce((sum, r) => 
    sum + (r.wateringMatch ? 1 : 0) + (r.fertilizingMatch ? 1 : 0) + (r.healthInRange ? 1 : 0), 0
  );
  
  console.log(`\n📈 Overall Pass Rate: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`📊 Tests Completed: ${validResults.length}/${scenarios.length}`);
  
  if (passedTests / totalTests >= 0.8) {
    console.log('\n✅ AI suggestions are performing well!');
  } else if (passedTests / totalTests >= 0.6) {
    console.log('\n⚠️ AI suggestions need minor improvements');
  } else {
    console.log('\n❌ AI suggestions need significant improvement');
  }
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { scenarios, testScenario, runAllTests };
}

// Run if called directly
if (typeof window === 'undefined' && require.main === module) {
  const args = process.argv.slice(2);
  const apiBase = args.includes('--api') ? args[args.indexOf('--api') + 1] : 'http://localhost:3000';
  
  runAllTests(apiBase).catch(console.error);
}