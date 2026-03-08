const http = require('http');

// Helper function to make HTTP requests with cookie support
function makeRequest(method, path, data = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (cookies) {
      options.headers['Cookie'] = cookies;
    }

    const req = http.request(options, (res) => {
      let body = '';
      
      // Store cookies from response
      let setCookieHeaders = res.headers['set-cookie'];
      let responseCookies = '';
      if (setCookieHeaders) {
        if (Array.isArray(setCookieHeaders)) {
          responseCookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
        } else {
          responseCookies = setCookieHeaders.split(';')[0];
        }
      }
      
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body),
            cookies: responseCookies
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            cookies: responseCookies
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  try {
    // Login as admin
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@college.edu',
      password: 'admin123'
    });
    
    const authCookie = loginRes.cookies;
    
    // Get all users
    const usersRes = await makeRequest('GET', '/api/admin/users', null, authCookie);
    console.log('Users response:', JSON.stringify(usersRes.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
