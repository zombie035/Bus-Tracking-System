const axios = require('axios');
const http = require('http');

// Helper to keep session cookie
const jar = { cookie: '' };

const client = axios.create({
    baseURL: 'http://localhost:5000',
    validateStatus: () => true // Don't throw on error status
});

async function runTest() {
    console.log('--- E2E Route Test ---');

    // 1. Login as Student
    console.log('1. Logging in...');
    const loginRes = await client.post('/api/test-login', {
        email: 'student@college.edu',
        password: 'admin123'
    });

    console.log('Login Status:', loginRes.status);
    if (!loginRes.data.success) {
        console.error('Login failed:', loginRes.data);
        return;
    }

    // Extract cookie
    const cookies = loginRes.headers['set-cookie'];
    if (cookies) {
        jar.cookie = cookies.join('; ');
        console.log('Cookie obtained');
    }

    // 2. Call getRouteInfo
    console.log('\n2. Requesting Route Info...');
    // NYC Setup
    const studentLat = 40.7128;
    const studentLng = -74.0060;
    const busLat = 40.7306;
    const busLng = -73.9352;

    const routeRes = await client.get('/api/student/route-info', {
        params: { studentLat, studentLng, busLat, busLng },
        headers: {
            Cookie: jar.cookie
        }
    });

    console.log('Route Info Status:', routeRes.status);
    console.log('Success:', routeRes.data.success);

    if (routeRes.data) {
        console.log('Is Straight Line:', routeRes.data.isStraightLine);
        console.log('Distance:', routeRes.data.distance);
        console.log('Coordinates count:', routeRes.data.coordinates ? routeRes.data.coordinates.length : 0);
        if (routeRes.data.error) {
            console.log('Error:', routeRes.data.error);
        }
    }
}

runTest();
