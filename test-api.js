const http = require('http');

// Test the health endpoint
const healthReq = http.get('http://localhost:4000/health', (res) => {
  console.log(`Health endpoint status: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`Health response: ${chunk}`);
  });
});

// Test the simple debug endpoint
const debugReq = http.get('http://localhost:4000/test-simple', (res) => {
  console.log(`Debug endpoint status: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`Debug response: ${chunk}`);
  });
});

console.log('API tests initiated...');