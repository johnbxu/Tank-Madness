import React, { Component } from 'react';
import ReactDOM from 'react-dom'
import grass from './assets/grass.png'
import './App.css';

const KEY = {
  LEFT:  37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
  SPACE: 32,
  W: 87,
  A: 65,
  S: 83,
  D: 68,
};

class App extends Component {
  constructor() {
    super()
    this.state = {
      players: {},
      keys: {
        left  : 0,
        right : 0,
        up    : 0,
        down  : 0,
        space : 0,
      },
      mouse: {
        x: 0,
        y: 0,
      }
    }
    this.socket = new WebSocket('ws://10.110.110.236:3003');
  }

  handleKeys(value, event) {
    let keys = this.state.keys
    if(event.keyCode === KEY.LEFT   || event.keyCode === KEY.A)  keys.left  = value;
    if(event.keyCode === KEY.RIGHT  || event.keyCode === KEY.D) keys.right = value;
    if(event.keyCode === KEY.UP     || event.keyCode === KEY.W)    keys.up    = value;
    if(event.keyCode === KEY.DOWN   || event.keyCode === KEY.S)  keys.down  = value;
    if(event.keyCode === KEY.SPACE) keys.space = value;
    this.setState({
      keys : keys
    });
  }




  componentDidMount() {
    const canvas = ReactDOM.findDOMNode(this.refs.canvas)
    const ctx = canvas.getContext("2d")
    const onMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect()
      this.setState({
        mouse:{
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        }
      })
    }

    const img = new Image()
    img.src = grass

    img.onload = () => {
      const pattern = ctx.createPattern(img, 'repeat')
      ctx.rect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = pattern
      ctx.fill()
    }
    this.respawn = () => {
      this.socket.send(JSON.stringify({type: 'respawn'}))
    }
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      switch (message.type) {
        case 'respawn':
          this.setState({
            collision: false,
          })
          break;
        case 'collision':
          this.setState({
            collision: true,
            deathMessage: message.message
          })
          break;
        case 'state':
          const players = []
          const bullets = []
          if (message.bullets) {
            for (const bullet in message.bullets) {
              bullets.push(message.bullets[bullet])
            }
            for (const player in message.players) {
              players.push(message.players[player])
            }
          } else {
            for (const player in message) {
              players.push(message[player])
            }
          }
          this.setState({
            players: players,
            bullets: bullets
          })

          ctx.clearRect(0,0,1280,720)

          const pattern = ctx.createPattern(img, 'repeat')

          ctx.rect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = pattern
          ctx.fill()

          ctx.fillStyle='blue'

          for (let player of players) {
            const turretX = player.position.x - 20 * Math.sin(player.turretOrientation + Math.PI /2)
            const turretY = player.position.y + 20 * Math.cos(player.turretOrientation + Math.PI /2)
            ctx.beginPath();
            ctx.arc(player.position.x, player.position.y, 10, 0, 2 * Math.PI)
            ctx.fill()
            ctx.beginPath();
            ctx.lineWidth = 5;
            ctx.moveTo(player.position.x, player.position.y);

            ctx.lineTo(turretX, turretY)
            ctx.stroke()
            // console.log(turretX, turretY)
          }
          if (bullets) {
            for (let bullet of bullets) {
              ctx.beginPath();
              ctx.fillStyle = 'red'
              ctx.arc(bullet.position.x, bullet.position.y, 5, 0, 2 * Math.PI)
              ctx.fill()
            }
          }
          break;
        default:
          break;

      }
    }

    window.addEventListener('keydown', this.handleKeys.bind(this, true));
    window.addEventListener('keyup',   this.handleKeys.bind(this, false));
    canvas.addEventListener('mousemove', onMouseMove)

    setInterval(() => {
      const keys = {
        type: 'keys',
        keys: this.state.keys,
        mouse: this.state.mouse,
      }
      this.socket.send(JSON.stringify(keys))
    }, 1000/60)


  }


  render() {
    const collision = this.state.collision && <h1>{this.state.deathMessage}</h1>
    const respawn = collision && <button onClick={this.respawn}>Click to Respawn</button>
    return(
      <div ref="App" className="App">
        <canvas ref="canvas" width={1280} height={720}/>
        {collision}
        {respawn}
        <h1>[W],[A],[S],[D] to move</h1>
        <h1>[SPACE] to shoot</h1>
        <h1>[MOUSE] to aim</h1>
      </div>
    )
  }
}

export default App;
