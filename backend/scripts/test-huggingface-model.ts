/**
 * HuggingFace Model Test Script
 * Tests the car-damage-level-detection-yolov8 model with various inputs
 * 
 * Usage: npx ts-node scripts/test-huggingface-model.ts [imageUrl]
 * 
 * Examples:
 *   npx ts-node scripts/test-huggingface-model.ts
 *   npx ts-node scripts/test-huggingface-model.ts https://example.com/car.jpg
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.HUGGINGFACE_API_KEY;
const MODEL_ENDPOINT = 'https://api-inference.huggingface.co/models/Roboflow/car-damage-level-detection-yolov8';

// Test images - public URLs of cars
const TEST_IMAGES = {
    sampleCar: 'https://adamssmash.com.au/wp-content/uploads/Car-Scratch-Repair.jpg',
    sampleCar2: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800',
};

interface YOLOv8Detection {
    class?: string;
    label?: string;
    confidence?: number;
    score?: number;
    bbox?: number[];
    box?: number[];
    x?: number;
    y?: number;
    w?: number;
    h?: number;
}

interface ModelResponse {
    detections?: YOLOv8Detection[];
    [key: string]: any;
}

/**
 * Test the HuggingFace model with an image URL
 */
async function testModel(imageUrl: string, label: string = 'Test Image'): Promise<void> {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Testing: ${label}`);
    console.log(`URL: ${imageUrl}`);
    console.log(`${'='.repeat(70)}`);

    try {
        console.log('\n📡 Sending request to HuggingFace API...');

        const startTime = Date.now();

        const response = await axios.post<ModelResponse>(
            MODEL_ENDPOINT,
            { inputs: imageUrl },
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
                timeout: 60000, // 60 seconds
            }
        );

        const duration = Date.now() - startTime;

        console.log(`\n✅ Response received in ${duration}ms`);
        console.log(`\nRaw Response Status: ${response.status}`);
        console.log(`\nRaw Response Data:`);
        console.log(JSON.stringify(response.data, null, 2));

        // Parse detections
        console.log(`\n${'─'.repeat(70)}`);
        console.log('PARSED RESPONSE:');
        console.log(`${'─'.repeat(70)}`);

        const detections = Array.isArray(response.data) ? response.data : response.data.detections || [];

        console.log(`\n📊 Detections Found: ${detections.length}`);

        if (detections.length === 0) {
            console.log('   ➡️  No damage detected in the image');
        } else {
            detections.forEach((detection, index) => {
                console.log(`\n   Detection #${index + 1}:`);
                console.log(`   ├─ Class: ${detection.class || detection.label || 'Unknown'}`);
                console.log(`   ├─ Confidence: ${(detection.confidence || detection.score || 0).toFixed(2)}`);
                console.log(`   ├─ Bounding Box: ${JSON.stringify(detection.bbox || detection.box || 'N/A')}`);
                console.log(`   └─ Full Object: ${JSON.stringify(detection)}`);
            });
        }

        // Show structure
        console.log(`\n${'─'.repeat(70)}`);
        console.log('RESPONSE STRUCTURE:');
        console.log(`${'─'.repeat(70)}`);
        console.log(`Keys in response: ${Object.keys(response.data).join(', ')}`);
        console.log(`Is array: ${Array.isArray(response.data)}`);
        console.log(`Is array of detections: ${Array.isArray(detections)}`);
    } catch (error: any) {
        console.error(`\n❌ Error occurred:`);

        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Status Text: ${error.response.statusText}`);
            console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);

            if (error.response.status === 401) {
                console.error('\n⚠️  Authentication Failed - Invalid API key');
            } else if (error.response.status === 503) {
                console.error('\n⚠️  Model is currently loading - try again in a moment');
            } else if (error.response.status === 410) {
                console.error('\n⚠️  Model is warming up - try again in a moment');
            }
        } else if (error.code === 'ECONNABORTED') {
            console.error('Request timeout - model might be loading');
        } else {
            console.error(`Message: ${error.message}`);
        }
    }
}

/**
 * Test with validation endpoint
 */
async function testValidation(): Promise<void> {
    console.log(`\n${'='.repeat(70)}`);
    console.log('TESTING API KEY VALIDATION');
    console.log(`${'='.repeat(70)}`);

    if (!API_KEY) {
        console.error('\n❌ HUGGINGFACE_API_KEY is not set in environment variables');
        console.error('Please set HUGGINGFACE_API_KEY in your .env file');
        return;
    }

    console.log(`✓ API Key found (${API_KEY.substring(0, 10)}...)`);

    try {
        console.log('\n📡 Testing API connectivity with minimal request...');

        const response = await axios.post(
            MODEL_ENDPOINT,
            { inputs: 'https://example.com/test.jpg' },
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            }
        );

        console.log('✅ API Key is valid and model is responding');
    } catch (error: any) {
        if (error.response?.status === 401) {
            console.error('❌ Invalid API key');
        } else if (error.response?.status === 503 || error.response?.status === 410) {
            console.log('✅ API Key is valid (model is loading/warming up)');
        } else {
            console.warn(`⚠️  Status code: ${error.response?.status}`);
        }
    }
}

/**
 * Main function
 */
async function main(): Promise<void> {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║         HuggingFace YOLOv8 Model Test Script                      ║
║  Testing: car-damage-level-detection-yolov8                       ║
╚════════════════════════════════════════════════════════════════════╝
    `);

    // Test validation first
    await testValidation();

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
        }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('✅ TEST COMPLETE');
    console.log(`${'='.repeat(70)}\n`);
}

// Run the script
main().catch(console.error);
