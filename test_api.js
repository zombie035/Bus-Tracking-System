const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/buses',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🔍 Testing API endpoint: GET /api/admin/buses');
console.log('📡 Making request to http://localhost:5000/api/admin/buses\n');

const req = http.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('\n📦 Response Body:');
      console.log(JSON.stringify(response, null, 2));

      if (response.success && response.buses) {
        console.log(`\n✅ Success! Found ${response.buses.length} buses:`);
        response.buses.forEach((bus, index) => {
          console.log(`   ${index + 1}. ${bus.bus_number} - ${bus.route_name} (${bus.status})`);
        });
      } else {
        console.log('\n❌ API returned success=false or no buses data');
      }
    } catch (error) {
      console.log('\n❌ Error parsing response JSON:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\n💡 Make sure the server is running on port 5000');
});

req.end();
