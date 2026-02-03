const axios = require('axios');

async function testEndpoint() {
    console.log('🚀 Testing /api/student/route-info endpoint...');
    try {
        const response = await axios.get('http://localhost:5000/api/student/route-info', {
            params: {
                studentLat: 9.925201,
                studentLng: 78.119775,
                busLat: 9.939093,
                busLng: 78.121719
            }
        });

        console.log('✅ Response Status:', response.status);
        console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, error.response.data);
        } else {
            console.error('❌ Connection Error:', error.message);
        }
    }
}

testEndpoint();
