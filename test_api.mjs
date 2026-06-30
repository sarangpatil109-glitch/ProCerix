import http from 'http';

function makeRequest(path, method, body, cookie = '') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      }
    };
    
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log("Testing POST /api/affiliate/apply...");
  const res = await makeRequest('/api/affiliate/apply', 'POST', {
    name: "Test User",
    phone: "1234567890",
    college_name: "Test College",
    designation: "Student",
    experience: "None"
  });
  console.log("Status:", res.status);
  console.log("Response:", res.data);
}

run();
