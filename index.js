const http = require('http');
const { createReadStream } = require('fs');
const { promisify } = require('util');
const stream = require('stream');
const socketIO = require('socket.io');
const bitgener = require('bitgener');

const pipeline = promisify(stream.pipeline);
const port = process.env.PORT || 3000;

/* eslint no-console: "off" */

// to get a readable stream from a file
const getFileStream = function getFileStream(path, options) {
  const rstream = createReadStream(path, options);
  rstream.on('error', (err) => {
    throw err;
  });

  if (rstream.readable) {
    return rstream;
  }

  throw new Error('stream not safely readable');
};

// server
const httpServer = http.createServer(async (request, response) => {
  request.on('error', (err) => {
    console.error(err);
    response.statusCode = 400;
    response.end(`bad request: ${err.message}`);
  });

  response.on('error', console.error);

  if (request.method === 'GET' && request.url === '/') {
    try {
      const index = getFileStream('index.html', 'utf-8');
      response.statusCode = 200;
      await pipeline(index, response);
    } catch (err) {
      console.error(err);
      response.statusCode = 500;
      response.end(`unable to load index page: ${err.message}`);
    }
  } else if (request.method === 'GET' && request.url === '/favicon.png') {
    try {
      const favicon = getFileStream('favicon.png', 'binary');
      response.setHeader('Content-Type', 'image/png');
      response.statusCode = 200;
      await pipeline(favicon, response);
    } catch (err) {
      console.error(err);
      response.statusCode = 500;
      response.end(`unable to load favicon: ${err.message}`);
    }
  } else if (request.method === 'GET' && request.url === '/favicon.ico') {
    try {
      const favicon = getFileStream('favicon.ico', 'binary');
      response.setHeader('Content-Type', 'image/x-icon');
      response.statusCode = 200;
      await pipeline(favicon, response);
    } catch (err) {
      console.error(err);
      response.statusCode = 500;
      response.end(`unable to load favicon: ${err.message}`);
    }
  } else if (request.method === 'GET' && request.url === '/googlee0d81878ea8f20d1.html') {
    try {
      const google = getFileStream('googlee0d81878ea8f20d1.html', 'utf-8');
      response.setHeader('Content-Type', 'text/html');
      response.statusCode = 200;
      await pipeline(google, response);
    } catch (err) {
      console.error(err);
      response.statusCode = 500;
      response.end(`unable to load google site verification page: ${err.message}`);
    }
  } else if (request.method === 'GET' && request.url.startsWith('/sitemap')) {
    try {
      const sitemap = getFileStream(request.url.slice(1), 'utf-8');
      response.setHeader('Content-Type', 'text/plain');
      response.statusCode = 200;
      await pipeline(sitemap, response);
    } catch (err) {
      console.error(err);
      response.statusCode = 500;
      response.end(`unable to load sitemap file: ${err.message}`);
    }
  } else {
    response.statusCode = 404;
    response.end('not found');
  }
});

// listening to http port
httpServer.listen(port, () => {
  console.log(`http server listening on port ${port}`);
});

// socket connection
const io = socketIO(httpServer);
let visitors = 0;

io.on('connection', async (socket) => {
  visitors += 1;
  console.log('visitor connected');
  console.log(`${visitors} visitor(s) connected`);

  // generate a barcode
  socket.on('generate', async (params) => {
    const ret = {
      error: undefined,
      svg: undefined,
    };
    const bitcodeParams = Object.assign({}, params);
    bitcodeParams.output = 'string';

    try {
      const result = await bitgener(bitcodeParams);
      ret.svg = result.svg;
    } catch (error) {
      ret.error = error;
    }

    socket.emit('bitcode', ret);
  });

  // disconnect
  socket.on('disconnect', () => {
    visitors -= 1;
    socket.broadcast.emit('visitors', visitors);
    console.log('visitor disconnected');
    console.log(`${visitors} visitor(s) connected`);
  });

  socket.emit('visitors', visitors);
  socket.broadcast.emit('visitors', visitors);
});
