const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('rs-ARV.key'),
  cert: fs.readFileSync('rs-ARV.crt')
};

const server = https.createServer(options, (req, res) => {
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello from RS-LAB22-ARV over HTTPS!\n');
  }
});

server.listen(443, () => {
  console.log('HTTPS server running on https://ARV');
});