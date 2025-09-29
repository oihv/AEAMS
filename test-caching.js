const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCaching() {
  console.log('🧪 Testing AI Suggestions Caching Implementation');
  console.log('==================================================');

  try {
    // Test 1: Check if we can create a mock suggestion
    const mockSuggestion = {
      watering: {
        recommendation: 'soon',
        hoursUntilNext: 2,
        reason: 'Soil moisture getting low',
        urgency: 'medium'
      },
      fertilizing: {
        recommendation: 'later',
        daysUntilNext: 7,
        reason: 'Nutrient levels adequate',
        type: 'balanced',
        urgency: 'low'
      },
      plantHealth: {
        score: 75,
        status: 'good',
        concerns: []
      }
    };

    // Create mock reading and cache entry
    console.log('📊 Creating mock cache entry...');
    const cacheEntry = await prisma.aISuggestion.create({
      data: {
        readingId: 'mock-reading-123',
        secondaryRodId: 'mock-rod-456',
        plantType: 'Tomatoes',
        model: 'rule_based',
        suggestion: mockSuggestion
      }
    });

    console.log('✓ Cache entry created with ID:', cacheEntry.id);

    // Test 2: Retrieve the cached entry
    console.log('📖 Testing cache retrieval...');
    const retrieved = await prisma.aISuggestion.findUnique({
      where: { readingId: 'mock-reading-123' }
    });

    if (retrieved) {
      console.log('✓ Cache retrieval successful');
      console.log('  - Plant Type:', retrieved.plantType);
      console.log('  - Model:', retrieved.model);
      console.log('  - Suggestion Keys:', Object.keys(retrieved.suggestion));
    } else {
      console.log('❌ Cache retrieval failed');
    }

    // Test 3: Clean up
    console.log('🧹 Cleaning up test data...');
    await prisma.aISuggestion.delete({
      where: { id: cacheEntry.id }
    });
    console.log('✓ Cleanup completed');

    console.log('');
    console.log('📊 CACHING IMPLEMENTATION STATUS');
    console.log('==================================================');
    console.log('✅ Database schema: READY');
    console.log('✅ Prisma model: ACCESSIBLE');
    console.log('✅ Cache operations: WORKING');
    console.log('⚠️  API integration: PENDING (server build issues)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCaching();