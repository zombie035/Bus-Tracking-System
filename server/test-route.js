const routeCalculator = require('./utils/routeCalculator');
require('dotenv').config();

async function test() {
    console.log('--- Testing Route Calculator ---');
    console.log('API Key present:', !!process.env.OPENROUTE_API_KEY);
    if (process.env.OPENROUTE_API_KEY) {
        console.log('API Key start:', process.env.OPENROUTE_API_KEY.substring(0, 5) + '...');
    }

    // Coordinates for two points (Madurai, India - project default area)
    const start = { lat: 9.849607, lng: 78.163951 };
    const end = { lat: 9.925201, lng: 78.119775 };   // Nearby point in Madurai

    console.log(`Calculating route from ${start.lat},${start.lng} to ${end.lat},${end.lng}...`);

    try {
        const result = await routeCalculator.calculateRoute(start, end);
        console.log('Result Success:', result.success);
        console.log('Distance:', result.distance, 'km');
        console.log('Duration:', result.duration, 'min');
        console.log('Is Straight Line:', result.isStraightLine || false);
        console.log('Coordinates count:', result.coordinates ? result.coordinates.length : 0);

        if (result.error) {
            console.log('Error Message:', result.error);
        }
    } catch (err) {
        console.error('Test failed:', err);
    }
}

test();
