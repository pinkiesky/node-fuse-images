const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api') {
    let chunks = [];
    let size = 0;
    req.on('data', chunk => {
      chunks.push(chunk);
      console.log(chunk);
      size += chunk.length;
      console.log('data', size, typeof chunk);
    });
    req.on('end', () => {
      console.log('end', size);
      // save file to fs 
      fs.writeFileSync('/tmp/file.png', Buffer.concat(chunks), { encoding: 'binary' });

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ done: true }));
    });
  } else {
    res.statusCode = 404;
    res.end();
  }
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
