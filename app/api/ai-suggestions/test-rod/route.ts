import { NextRequest, NextResponse } from 'next/server';
import { AISuggestionService } from '@/lib/ai-suggestions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plantType, rodData } = body;

    if (!plantType || !rodData) {
      return NextResponse.json(
        { error: 'Missing plantType or rodData' },
        { status: 400 }
      );
    }

    // Use the AI suggestions service with test data
    const reading = rodData.readings[0]; // Use first reading for test
    const suggestions = await AISuggestionService.generateSuggestions(reading, plantType);

    // Transform to match API response format
    const response = {
      watering: suggestions.watering,
      fertilizing: suggestions.fertilizing,
      healthScore: suggestions.plantHealth.score,
      urgency: suggestions.watering.urgency, // Use watering urgency as overall urgency
      modelType: 'rule_based', // Default for test endpoint
      plantHealth: suggestions.plantHealth
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI suggestions test error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI suggestions for test' },
      { status: 500 }
    );
  }
}