const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

async function testStops() {
    console.log('🚀 Testing /api/student/route-stops...');
    try {
        // 1. Login as student to get session
        console.log('🔐 Logging in...');
        await client.post('http://localhost:5000/api/test-login', {
            email: 'student@college.edu',
            password: 'admin123'
        });

        // 2. Get stops
        console.log('🛑 Fetching stops...');
        const response = await client.get('http://localhost:5000/api/student/route-stops');

        console.log('✅ Response Status:', response.status);
        console.log('📦 Stops Found:', response.data.stops?.length || 0);
        if (response.data.stops?.length > 0) {
            console.log('📍 First Stop:', response.data.stops[0]);
        } else {
            console.log('⚠️ No stops returned!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) console.error('   Data:', error.response.data);
    }
}

testStops();
