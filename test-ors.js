const routeCalculator = require('./server/utils/routeCalculator');
require('dotenv').config({ path: './server/.env' }); // Ensure env is loaded

async function test() {
    process.env.OPENROUTE_API_KEY = process.env.OPENROUTE_API_KEY || '5b3ce3597851110001cf624898d9e27c154344589258925827361543'; // Fallback if needed for test? Ideally read from file.

    console.log('API Key present:', !!process.env.OPENROUTE_API_KEY);

    // Mock Stops (Madurai area)
    const stops = [
        { lat: 9.9252, lng: 78.1198 }, // Stop A
        { lat: 9.93, lng: 78.13 },     // Stop B
        { lat: 9.94, lng: 78.15 }      // Stop C
    ];

    console.log('Testing calculateRoute with 3 stops (Objects)...');
    const result = await routeCalculator.calculateRoute(stops[0], stops[2], stops);

    if (result.success && !result.isStraightLine) {
        console.log('✅ Success! Returned curved path.');
        console.log('Points count:', result.coordinates.length);
        console.log('Geometry present:', !!result.geometry);
    } else {
        console.error('❌ Failed. Returned straight line or error.');
        console.log('Result:', result);
    }
}

test();
