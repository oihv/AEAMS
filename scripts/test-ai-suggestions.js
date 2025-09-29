#!/usr/bin/env node

/**
 * AI Suggestions Test Runner
 * 
 * Run this script to test the AI suggestion quality automatically
 * Usage: node scripts/test-ai-suggestions.js
 */

const { scenarios, testScenario, runAllTests } = require('../tests/ai-suggestions-test.ts');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🤖 AI Suggestions Test Runner

Usage:
  node scripts/test-ai-suggestions.js [options]

Options:
  --all, -a          Run all test scenarios
  --scenario <id>    Run specific scenario by ID  
  --list, -l         List available scenarios
  --help, -h         Show this help

Examples:
  node scripts/test-ai-suggestions.js --all
  node scripts/test-ai-suggestions.js --scenario tomato-dry-low-nutrients
  node scripts/test-ai-suggestions.js --list
`);
    return;
  }

  if (args.includes('--list') || args.includes('-l')) {
    console.log('📋 Available Test Scenarios:\n');
    scenarios.forEach((scenario, index) => {
      console.log(`${index + 1}. ${scenario.id}`);
      console.log(`   Name: ${scenario.name}`);
      console.log(`   Plant: ${scenario.plantType}`);
      console.log('');
    });
    return;
  }

  if (args.includes('--all') || args.includes('-a')) {
    await runAllTests();
    return;
  }

  const scenarioIndex = args.indexOf('--scenario');
  if (scenarioIndex !== -1 && args[scenarioIndex + 1]) {
    const scenarioId = args[scenarioIndex + 1];
    const scenario = scenarios.find(s => s.id === scenarioId);
    
    if (!scenario) {
      console.error(`❌ Scenario '${scenarioId}' not found`);
      console.log('\nAvailable scenarios:');
      scenarios.forEach(s => console.log(`  - ${s.id}`));
      return;
    }

    await testScenario(scenario);
    return;
  }

  console.log('❌ No valid options provided. Use --help for usage information.');
}

if (require.main === module) {
  main().catch(console.error);
}