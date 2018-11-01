const uuid = require('uuid')
// server.js
const random = () => {
  const coord = {}
  coord.x = Math.random() * 1280
  coord.y = Math.random() * 720
  return coord
}

class Player {
  constructor(id, position) {
    this.id = id;
    this.position = position;
  }
}
const checkCollisionWith = (player, otherPlayers) => {
  for (const ele in otherPlayers) {
    if (player.id !== otherPlayers[ele].id) {
      if (checkCollision(player, otherPlayers[ele])){
        return true
      }
    }
  }
}

const checkCollision = (obj1, obj2) => {
  var vx = obj1.position.x - obj2.position.x;
  var vy = obj1.position.y - obj2.position.y;
  var length = Math.sqrt(vx * vx + vy * vy);
  if (length < 20) {
    console.log(length)
    return true;
  }
  return false;
}

const express = require('express');
const SocketServer = require('ws').Server;

// Set the port to 3003
const PORT = 3003;

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));


// Create the WebSockets server
const wss = new SocketServer({ server });

// Initializing the broadcast function
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};

const players = {};
// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.id = uuid();
  players[ws.id] = new Player(ws.id, random())
  setInterval(function() {
    wss.broadcast(JSON.stringify(players))
  }, 1000/60)

  ws.on('message', function incoming(data){
    const movement = JSON.parse(data)
    if (movement.left) {
      players[ws.id].position.x -= 5
      players[ws.id].orientation = 'left'
    }
    if (movement.right) {
      players[ws.id].position.x += 5
      players[ws.id].orientation = 'right'
    }
    if (movement.up) {
      players[ws.id].position.y -= 5
      players[ws.id].orientation = 'up'
    }
    if (movement.down) {
      players[ws.id].position.y += 5
      players[ws.id].orientation = 'down'
    }
    if (checkCollisionWith(players[ws.id], players)) {
      wss.broadcast('COLLISION!!!')
    } else {
      wss.broadcast('NO')
    }
  })

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    delete players[ws.id]
    console.log('Client disconnected');
  })
});
