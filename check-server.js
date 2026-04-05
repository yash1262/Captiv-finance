// Quick script to check if backend server is running
const http = require('http');

const checkServer = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log('✅ Backend server is running!');
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Backend server is NOT running!');
    console.error('Error:', error.message);
    console.log('\nTo start the backend server, run:');
    console.log('  npm start');
  });

  req.on('timeout', () => {
    console.error('❌ Request timeout - server might be hung');
    req.destroy();
  });

  req.end();
};

checkServer();
