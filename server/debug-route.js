const routeCalculator = require('./utils/routeCalculator');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔑 API Key present:', !!process.env.OPENROUTE_API_KEY);
if (process.env.OPENROUTE_API_KEY) {
    console.log('🔑 API Key start:', process.env.OPENROUTE_API_KEY.substring(0, 5) + '...');
}

async function test() {
    console.log('🚀 Testing route calculation...');
    try {
        const result = await routeCalculator.calculateRoute(
            { lat: 9.925201, lng: 78.119775 }, // Madurai
            { lat: 9.939093, lng: 78.121719 }  // Nearby
        );
        console.log('✅ Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

test();
