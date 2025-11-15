#!/usr/bin/env node

/**
 * Roboflow Model Test Script
 * Tests the car-damage-c1f0i model for damage detection
 * 
 * Usage: node scripts/test-roboflow-model.js [imageUrl]
 * 
 * Examples:
 *   node scripts/test-roboflow-model.js
 *   node scripts/test-roboflow-model.js https://example.com/car.jpg
 */

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_KEY = process.env.ROBOFLOW_API_KEY;
const MODEL_ENDPOINT = 'https://serverless.roboflow.com/car-damage-c1f0i/1';

// Test images - public URLs of cars
const TEST_IMAGES = {
    car_front:"https://media.istockphoto.com/id/175195079/photo/a-red-car-with-a-damaged-headlight-after-an-accident.jpg?s=612x612&w=0&k=20&c=xM6qXM58jCojDt9wr-g2TRZyBGrL75oy_re2nryRiIw="
};

/**
 * Test the Roboflow model with an image URL
 */
async function testModel(imageUrl, label = 'Test Image') {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Testing: ${label}`);
    console.log(`URL: ${imageUrl}`);
    console.log(`${'='.repeat(70)}`);

    try {
        console.log('\n📡 Sending request to Roboflow API...');

        const startTime = Date.now();

        const response = await axios({
            method: 'POST',
            url: MODEL_ENDPOINT,
            params: {
                api_key: API_KEY,
                image: imageUrl,
            },
            timeout: 60000, // 60 seconds
        });

        const duration = Date.now() - startTime;

        console.log(`\n✅ Response received in ${duration}ms`);
        console.log(`\nResponse Status: ${response.status}`);
        console.log(`\n📋 Raw Response Data:`);
        console.log(JSON.stringify(response.data, null, 2));

        // Parse predictions
        console.log(`\n${'─'.repeat(70)}`);
        console.log('PARSED RESPONSE:');
        console.log(`${'─'.repeat(70)}`);

        const predictions = response.data.predictions || [];

        console.log(`\n📊 Detections Found: ${predictions.length}`);

        if (predictions.length === 0) {
            console.log('   ➡️  No damage detected in the image');
        } else {
            predictions.forEach((prediction, index) => {
                console.log(`\n   Detection #${index + 1}:`);
                console.log(`   ├─ Class: ${prediction.class || 'Unknown'}`);
                console.log(`   ├─ Confidence: ${(prediction.confidence || 0).toFixed(2)}`);
                console.log(`   ├─ Bounding Box: x=${prediction.x}, y=${prediction.y}, w=${prediction.width}, h=${prediction.height}`);
                console.log(`   └─ Full Object: ${JSON.stringify(prediction)}`);
            });
        }

        // Show structure
        console.log(`\n${'─'.repeat(70)}`);
        console.log('RESPONSE STRUCTURE:');
        console.log(`${'─'.repeat(70)}`);
        console.log(`Keys in response: ${Object.keys(response.data).join(', ')}`);
        console.log(`Model: ${response.data.model}`);
        console.log(`Image: ${response.data.image}`);
        console.log(`Predictions count: ${predictions.length}`);

        return response.data;
    } catch (error) {
        console.error(`\n❌ Error occurred:`);

        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Status Text: ${error.response.statusText}`);
            console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);

            if (error.response.status === 401) {
                console.error('\n⚠️  Authentication Failed - Invalid API key');
            } else if (error.response.status === 400) {
                console.error('\n⚠️  Bad Request - Invalid parameters');
            }
        } else if (error.code === 'ECONNABORTED') {
            console.error('Request timeout - server might be busy');
        } else {
            console.error(`Message: ${error.message}`);
        }
        return null;
    }
}

/**
 * Test with validation endpoint
 */
async function testValidation() {
    console.log(`\n${'='.repeat(70)}`);
    console.log('TESTING API KEY VALIDATION');
    console.log(`${'='.repeat(70)}`);

    if (!API_KEY) {
        console.error('\n❌ ROBOFLOW_API_KEY is not set in environment variables');
        console.error('Please set ROBOFLOW_API_KEY in your .env file');
        return false;
    }

    console.log(`✓ API Key found (${API_KEY.substring(0, 10)}...)`);

    try {
        console.log('\n📡 Testing API connectivity with test request...');

        const response = await axios({
            method: 'POST',
            url: MODEL_ENDPOINT,
            params: {
                api_key: API_KEY,
                image: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=400',
            },
            timeout: 30000,
        });

        console.log('✅ API Key is valid and model is responding');
        return true;
    } catch (error) {
        if (error.response?.status === 401) {
            console.error('❌ Invalid API key');
            return false;
        } else if (error.response?.status === 400) {
            console.error('⚠️  Bad request (but API key appears valid)');
            return true;
        } else {
            console.warn(`⚠️  Status code: ${error.response?.status}`);
            console.warn(`Message: ${error.message}`);
            return false;
        }
    }
}

/**
 * Main function
 */
async function main() {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║         Roboflow Model Test Script                                ║
║  Testing: car-damage-c1f0i model                                  ║
╚════════════════════════════════════════════════════════════════════╝
    `);

    // Test validation first
    const isValid = await testValidation();

    if (!isValid) {
        console.error('\n❌ Cannot proceed without valid API key');
        process.exit(1);
    }

    // Get image URL from command line or use defaults
    const customImageUrl = process.argv[2];

    if (customImageUrl) {
        // Test with provided image
        await testModel(customImageUrl, 'Custom Image URL');
    } else {
        // Test with sample images
        console.log(`\n${'='.repeat(70)}`);
        console.log('TESTING WITH SAMPLE IMAGES');
        console.log(`${'='.repeat(70)}`);

        for (const [key, url] of Object.entries(TEST_IMAGES)) {
            await testModel(url, `Sample: ${key}`);
            // Add delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('✅ TEST COMPLETE');
    console.log(`${'='.repeat(70)}\n`);
}

// Run the script
main().catch(console.error);
