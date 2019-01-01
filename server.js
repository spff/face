const express = require('express');
const serveStatic = require("serve-static")
const SocketServer = require('ws').Server;
const path = require('path');
const port = process.env.PORT || 80;

const app = express()
  .use(serveStatic(path.join(__dirname, 'dist')))
  .listen(port);

const wss = new SocketServer({ server : app });
console.log('Hi');
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(new Date().toTimeString());
  });
}, 1000);