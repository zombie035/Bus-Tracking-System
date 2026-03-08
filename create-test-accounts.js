const axios = require('axios');

async function createTestAccounts() {
  try {
    console.log('🔧 Creating test accounts...');
    
    const response = await axios.post('http://localhost:5000/api/auth/create-test-accounts', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Test accounts created successfully!');
    console.log('📋 Available accounts:');
    console.log(response.data.testAccounts);
    
  } catch (error) {
    console.error('❌ Error creating test accounts:', error.response?.data || error.message);
  }
}

createTestAccounts();
