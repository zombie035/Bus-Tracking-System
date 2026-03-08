// Test Authentication Component
import React, { useState } from 'react';
import mockAuthService from '../services/mockAuthService';

const TestAuth = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLogin = async (phone, password) => {
    setLoading(true);
    setResult('');
    
    try {
      const loginResult = await mockAuthService.loginWithMobile(phone, password);
      setResult(JSON.stringify(loginResult, null, 2));
    } catch (error) {
      setResult('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px', borderRadius: '8px' }}>
      <h3>🧪 Test Authentication</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Available Test Accounts:</h4>
        <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          <div>+91-9876543210 / password123 (John Smith - BUS001)</div>
          <div>+91-9876543211 / password123 (Sarah Johnson - BUS002)</div>
          <div>+91-9876543212 / password123 (Michael Chen - BUS003)</div>
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={() => testLogin('+91-9876543210', 'password123')}
          disabled={loading}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Test Driver 1
        </button>
        <button 
          onClick={() => testLogin('+91-9876543211', 'password123')}
          disabled={loading}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Test Driver 2
        </button>
        <button 
          onClick={() => testLogin('+91-9876543212', 'password123')}
          disabled={loading}
          style={{ padding: '8px 16px' }}
        >
          Test Driver 3
        </button>
      </div>

      {loading && <div>Testing...</div>}
      
      {result && (
        <div style={{ 
          background: '#fff', 
          padding: '10px', 
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px',
          whiteSpace: 'pre-wrap',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          {result}
        </div>
      )}
    </div>
  );
};

export default TestAuth;
