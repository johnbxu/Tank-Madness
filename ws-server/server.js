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
      if (group1[ele].id !== group2[ele2].id && group1[ele].id !== group2[ele2].owner) {
        if (checkCollision(group1[ele], group2[ele2])){
          const collision = {
            object1: group1[ele],
            object2: group2[ele2],
            state: true,
          }
          // const id = group1[ele]
          delete group1[ele];
          delete group2[ele2];
          return collision
        }
      }
    }
  }
  return {state: false}
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

const angle = (x1, y1, x2, y2) => {
  const dx = x2 - x1
  const dy = y2 - y1
  let theta = Math.atan2(dy, dx) + Math.PI
  return theta
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
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
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
      type: 'state',
      players: players,
      bullets: bullets,
    }))
  }, 1000/60)

  ws.on('message', function incoming(data){
    const message = JSON.parse(data)
    if (message.type === 'respawn') {
      players[ws.id] = new Player(ws.id, random())
      ws.send(JSON.stringify({type: 'respawn'}))
    }
    if (message.type === 'keys') {
      const mousePos = {
        x: message.mouse.x,
        y: message.mouse.y,
      }
      const keyPress = message.keys
      if (players[ws.id]) {
        const turretOrientation = angle(players[ws.id].position.x, players[ws.id].position.y, mousePos.x, mousePos.y)
        players[ws.id].turretOrientation = turretOrientation
        if (keyPress.left && players[ws.id].position.x > 0) {
          players[ws.id].position.x -= 5
          players[ws.id].orientation = 'left'
        }
        if (keyPress.right && players[ws.id].position.x < 1280) {
          players[ws.id].position.x += 5
          players[ws.id].orientation = 'right'
        }
        if (keyPress.up && players[ws.id].position.y > 0) {
          players[ws.id].position.y -= 5
          players[ws.id].orientation = 'up'
        }
        if (keyPress.down && players[ws.id].position.y < 720) {
          players[ws.id].position.y += 5
          players[ws.id].orientation = 'down'
        }
        if (keyPress.space && !ws.bulletCooldown) {
          const id = uuid()
          const bullet = {
            id: id,
            owner: ws.id,
            type: 'bullet',
            position: {
              x: players[ws.id].position.x,
              y: players[ws.id].position.y
            },
            orientation: turretOrientation,
          }
          bullets[id] = bullet
          ws.bulletCooldown = true
          setTimeout(() => ws.bulletCooldown = false, 1000 / 2)
        }
        const playerCollision = checkCollisionWith(players, players)
        const bulletCollision = checkCollisionWith(players, bullets)
        if (playerCollision.state) {
          const player1 = playerCollision.object1
          const player2 = playerCollision.object2
          const response = {
            type: 'collision',
            message: 'You collided with another player!'
          }
          wss.clients.forEach(function each(client){
            if (client.id === player1.id || client.id === player2.id) {
              client.send(JSON.stringify(response))
            }
          })
        }
        if (bulletCollision.state) {
          const playerId = bulletCollision.object1.id
          const hitByPlayerID = bulletCollision.object2.owner
          const response = {
            type: 'collision',
            message: 'You were hit by player: ' + hitByPlayerID
          }
          wss.clients.forEach(function each(client){
            if (client.id === playerId) {
              client.send(JSON.stringify(response))
            }
          })
        }
        for (const bullet in bullets) {
          bullets[bullet].position.x -= 10 * Math.sin(bullets[bullet].orientation + Math.PI /2)
          bullets[bullet].position.y += 10 * Math.cos(bullets[bullet].orientation + Math.PI /2)
          if (bullets[bullet].position.x < 0 || bullets[bullet].position.y < 0 || bullets[bullet].position.x > 1280 || bullets[bullet].position.y > 720) {
            delete bullets[bullet]
          }
        }

    }



    }
  })

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    delete players[ws.id]
    console.log('Client disconnected');
  })
});
