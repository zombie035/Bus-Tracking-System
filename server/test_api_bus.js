// Quick API test for bus creation
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/admin/buses';

async function testBusAPI() {
    console.log('\n🧪 Testing Bus Creation API');
    console.log('============================\n');

    const testBus = {
        busNumber: 'API-TEST-' + Date.now(),
        routeName: 'Test Route',
        capacity: 50,
        status: 'active',
        driverId: null,
        latitude: 20.5937,
        longitude: 78.9629
    };

    try {
        console.log('📤 Sending POST request to:', API_URL);
        console.log('   Data:', testBus);

        const response = await axios.post(API_URL, testBus, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });

        console.log('\n✅ Response Status:', response.status);
        console.log('   Response Data:', response.data);
        console.log('\n   Success:', response.data.success);
        console.log('   Message:', response.data.message);
        console.log('   Bus Created:', response.data.bus);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }

    console.log('\n============================\n');
}

testBusAPI();
