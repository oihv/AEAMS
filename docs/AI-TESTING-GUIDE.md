# AI Suggestions Testing Guide

This guide helps you manually test the quality of AI suggestions in your AEAMS system.

## 🚀 Quick Start Testing

### Method 1: Automated Testing (Recommended)

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Set up your HuggingFace token (optional but recommended):**
   ```bash
   echo "HF_TOKEN=your-huggingface-token-here" >> .env
   ```

3. **Run the automated tests:**
   ```bash
   # Run all test scenarios
   node scripts/test-ai-suggestions.js --all
   
   # Or test a specific scenario
   node scripts/test-ai-suggestions.js --scenario tomato-dry-low-nutrients
   ```

### Method 2: Manual UI Testing

1. **Create test farms with different plant types:**
   - Go to dashboard → Create Farm
   - Create farms for: Tomatoes, Lettuce, Corn, Carrots, Peppers, Herbs

2. **Create test rods with varying sensor data:**
   - Use the admin panel or API to create rods with specific readings
   - Test different moisture, pH, and nutrient levels

3. **Check AI suggestions in rod cards:**
   - Click "🤖 AI Suggestions" on each rod card
   - Evaluate the quality of recommendations

## 📊 Test Scenarios

### 1. Tomato Plant - Dry Soil, Low Nutrients
**Expected Conditions:**
- Moisture: 15% (very low)
- pH: 6.8 (good for tomatoes)  
- Nitrogen: 12 (low)
- Phosphorus: 8 (low for flowering)

**Expected AI Response:**
- ✅ **Watering**: High urgency, mentions "water immediately"
- ✅ **Fertilizing**: High urgency, mentions "nitrogen" and "phosphorus"
- ✅ **Health Score**: 30-50 (poor conditions)

### 2. Lettuce - Optimal Conditions
**Expected Conditions:**
- Moisture: 65% (good)
- pH: 6.2 (optimal for lettuce)
- Nitrogen: 35 (high - good for leafy greens)
- Temperature: 18°C (perfect)

**Expected AI Response:**
- ✅ **Watering**: Low urgency, "maintain current levels"
- ✅ **Fertilizing**: Low urgency, "adequate nutrients"
- ✅ **Health Score**: 80-95 (excellent conditions)

### 3. Corn - Hot Weather, Overwatered
**Expected Conditions:**
- Moisture: 85% (too wet)
- Temperature: 32.5°C (hot)
- Conductivity: 2.1 (high - salt buildup)

**Expected AI Response:**
- ✅ **Watering**: Low urgency, "reduce watering" or "improve drainage"
- ✅ **Fertilizing**: Medium urgency, mentions "salt buildup"
- ✅ **Health Score**: 40-65 (stressed from overwatering)

### 4. Carrots - Acidic Soil
**Expected Conditions:**
- pH: 5.2 (too acidic)
- Phosphorus: 25 (high - good for roots)
- Nitrogen: 8 (low but acceptable)

**Expected AI Response:**
- ✅ **Watering**: Medium urgency
- ✅ **Fertilizing**: High urgency, mentions "pH too low" or "lime"
- ✅ **Health Score**: 50-70 (limited by pH)

### 5. Peppers - Severe Nutrient Deficiency
**Expected Conditions:**
- Conductivity: 0.3 (very low)
- All NPK values critically low
- pH: 6.5 (perfect for peppers)

**Expected AI Response:**
- ✅ **Watering**: Medium urgency
- ✅ **Fertilizing**: Critical urgency, "severe deficiency"
- ✅ **Health Score**: 20-40 (very poor nutrition)

## 🎯 Quality Evaluation Criteria

### Watering Recommendations (Score /10)
- **Urgency Accuracy (4 pts)**: Does urgency match soil moisture?
- **Content Quality (6 pts)**: Mentions specific moisture %, actionable advice

### Fertilizing Recommendations (Score /10)
- **Urgency Accuracy (4 pts)**: Matches nutrient levels and pH?
- **Content Quality (6 pts)**: Specific nutrients mentioned, plant-appropriate advice

### Health Score (Score /10)
- **Range Accuracy (10 pts)**: Score reflects overall plant health?

### Overall Quality Benchmarks
- **8-10**: Excellent - Ready for production
- **6-7**: Good - Minor improvements needed  
- **4-5**: Needs Improvement - Review AI prompts
- **0-3**: Poor - Major issues with AI logic

## 🔧 Testing Without HuggingFace Token

If you don't have an HF token, the system uses rule-based fallbacks:

**Rule-Based Logic:**
- **Moisture < 30%**: High watering urgency
- **Moisture 30-60%**: Medium watering urgency  
- **Moisture > 60%**: Low watering urgency
- **pH < 6.0 or > 7.5**: High fertilizing urgency
- **Low NPK**: Recommends specific nutrients

## 🐛 Common Issues & Troubleshooting

### "API call failed: 500"
- Check if development server is running
- Verify HF_TOKEN in .env file
- Check console logs for detailed errors

### "Missing plantType or rodData"
- Ensure test scenarios include both fields
- Check JSON structure in test data

### Inconsistent Suggestions
- AI responses may vary between calls
- Run tests multiple times for average scores
- Rule-based fallbacks should be consistent

## 📈 Improving AI Quality

### If Overall Score < 6:
1. **Review AI Prompts** in `lib/ai-suggestions.ts`
2. **Add More Plant-Specific Knowledge** to prompts
3. **Test Edge Cases** with extreme sensor values
4. **Validate Rule-Based Fallbacks** work correctly

### Prompt Tuning Tips:
- Be more specific about plant needs
- Include seasonal considerations  
- Add urgency keywords for better detection
- Provide more context about optimal ranges

## 📊 Sample Test Results

```
🧪 Testing: Tomato Plant - Dry Soil, Low Nutrients
📊 Plant Type: Tomatoes
📋 Results:
   Watering: 9/10 - ✅ Urgency level correct | ✅ Matched 3/3 key concepts
   Fertilizing: 8/10 - ✅ Urgency level correct | ✅ Matched 3/4 key concepts  
   Health Score: 10/10 - ✅ Health score 42 in expected range 30-50
   Overall: 9/10 - Excellent
```

## 🎯 Next Steps

After testing, consider:
- **Performance Testing**: Response time under load
- **A/B Testing**: Compare different AI prompts
- **User Feedback**: Collect real farmer evaluations
- **Historical Analysis**: Track suggestion accuracy over time