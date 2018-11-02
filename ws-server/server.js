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

class Bullet {
  constructor(id, position) {
    this.id = id;
    this.position = position;
  }
}

const checkCollisionWith = (group1, group2) => {
  for (const ele in group1) {
    for (const ele2 in group2) {
      if (group1[ele].id !== group2[ele2].id) {
        if (checkCollision(group1[ele], group2[ele2])){
          return true
        }
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
const bullets = {};
// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.id = uuid();
  players[ws.id] = new Player(ws.id, random())
  setInterval(function() {
    wss.broadcast(JSON.stringify({
      players: players,
      bullets: bullets
    }))
  }, 1000/60)

  ws.on('message', function incoming(data){
    const movement = JSON.parse(data)
    if (movement.left && players[ws.id].position.x > 0) {
      players[ws.id].position.x -= 5
      players[ws.id].orientation = 'left'
    }
    if (movement.right && players[ws.id].position.x < 1280) {
      players[ws.id].position.x += 5
      players[ws.id].orientation = 'right'
    }
    if (movement.up && players[ws.id].position.y > 0) {
      players[ws.id].position.y -= 5
      players[ws.id].orientation = 'up'
    }
    if (movement.down && players[ws.id].position.y < 720) {
      players[ws.id].position.y += 5
      players[ws.id].orientation = 'down'
    }
    if (movement.space) {
      const id = uuid()
      const bullet = {
        id: id,
        owner: ws.id,
        type: 'bullet',
        position: {
          x: players[ws.id].position.x,
          y: players[ws.id].position.y
        },
        orientation: players[ws.id].orientation,
      }
      bullets[id] = bullet
    }
    if (checkCollisionWith(players, players) || checkCollisionWith(players, bullets)) {
      wss.broadcast('COLLISION!!!')
    } else {
      wss.broadcast('NO')
    }
    for (const bullet in bullets) {
      if (bullets[bullet].orientation === 'up') {
        bullets[bullet].position.y -= 10
      }
      if (bullets[bullet].orientation === 'down') {
        bullets[bullet].position.y += 10
      }
      if (bullets[bullet].orientation === 'left') {
        bullets[bullet].position.x -= 10
      }
      if (bullets[bullet].orientation === 'right') {
        bullets[bullet].position.x += 10
      }
      if (bullets[bullet].position.x < 0 || bullets[bullet].position.y < 0 || bullets[bullet].position.x > 1280 || bullets[bullet].position.y > 720) {
        delete bullets[bullet]
      }
    }
  })

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    delete players[ws.id]
    console.log('Client disconnected');
  })
});
