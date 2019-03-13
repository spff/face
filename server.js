const express = require('express');
const serveStatic = require("serve-static")
const bodyParser = require('body-parser')
const axios = require('axios')

const SocketServer = require('ws').Server
const path = require('path');
const port = process.env.PORT || 80

const list = []
const printers = new Set()

function sendLog(msg) {
  console.log(msg)
  axios.post('https://hooks.slack.com/services/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',
    msg,
    {'Content-Type': 'application/json'}
  )
    .catch(err => {
      console.log('err ' + err)
    })
}

function receive_post(data) {
  sendLog({text:JSON.stringify({
    role: 'server',
    event: 'receive_post',
    data: data
  })})
}

function printer_connected(total_connected_after) {
  sendLog({text:JSON.stringify({
    role: 'server',
    event: 'printer_connected',
    data: total_connected_after
  })})
}

function printer_disconnected(total_connected_after) {
  sendLog({text:JSON.stringify({
    role: 'server',
    event: 'printer_disconnected',
    data: total_connected_after
  })})
}


const app = express()
  .use(bodyParser.json())
  .use(serveStatic(path.join(__dirname, 'dist')))
  .post('/', (req, res) => {
    const msg = JSON.stringify(req.body)
    receive_post(req.body)

    list.unshift({ data: req.body, time: new Date() })
    while (list.length > 100) {
      list.pop()
    }
    printers.forEach((client) => {
      client.send(JSON.stringify(list))
      
    })
    
    res.send('OK')
  })
  .listen(port)

const wss = new SocketServer({ server: app })

wss.on('connection', (ws) => {
  console.log('Client connected')
  ws.on('message', (msg) => {
    if (msg == 'keep-alive') {

    } else if (msg == 'printer') {
      console.log('Printer online')
      ws.send(JSON.stringify(list))
      printers.add(ws)
      printer_connected(printers.size)
    }
  })
  ws.on('close', () => {
    const bf = printers.size
    printers.delete(ws)
    const at = printers.size
    if(bf != at) {
      printer_disconnected(at)
    }
  })
})

const https = require("https");
https.get("https://stereotype-face.herokuapp.com/")
setInterval(function () {
  try {
    https.get("https://stereotype-face.herokuapp.com/")
  } catch {
    console.log('nooo')
  }
}, 300000); // every 5 minutes (300000)