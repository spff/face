const express = require('express');
const serveStatic = require("serve-static")
const SocketServer = require('ws').Server
const path = require('path');
const port = process.env.PORT || 80

const app = express()
  .use(serveStatic(path.join(__dirname, 'dist')))
  .listen(port)

const list = []
const printers = new Set()

const wss = new SocketServer({ server : app })
console.log('Hi');
wss.on('connection', (ws) => {
  console.log('Client connected')
  ws.on('message', (msg) => {
    if ( msg == 'printer' )  {
      console.log('Printer online')
      printers.add(ws) 
    } else {
      list.unshift({ data: JSON.parse(msg), time: new Date()})
      while (list.length > 100) {
        list.pop()
      }
      printers.forEach((client) => {
        client.send(JSON.stringify(list))
      })
    }
  })
  ws.on('close', () => printers.delete(ws))
})
