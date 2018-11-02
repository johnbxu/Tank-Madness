import React, { Component } from 'react';
import ReactDOM from 'react-dom'
import grass from './assets/grass.png'
import './App.css';

const KEY = {
  LEFT:  37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
  SPACE: 32
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
      }
    }
    this.socket = new WebSocket('ws://localhost:3003');
  }

  handleKeys(value, event) {
    let keys = this.state.keys
    if(event.keyCode === KEY.LEFT)  keys.left  = value;
    if(event.keyCode === KEY.RIGHT) keys.right = value;
    if(event.keyCode === KEY.UP)    keys.up    = value;
    if(event.keyCode === KEY.DOWN)  keys.down  = value;
    if(event.keyCode === KEY.SPACE) keys.space = value;
    this.setState({
      keys : keys
    });
  }




  componentDidMount() {
    const canvas = ReactDOM.findDOMNode(this.refs.canvas)
    const ctx = canvas.getContext("2d")

    const img = new Image()
    img.src = grass

    img.onload = () => {
      const pattern = ctx.createPattern(img, 'repeat')

      ctx.rect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = pattern
      ctx.fill()

      ctx.fillStyle = 'black'

    }
    this.socket.onmessage = (event) => {
      if (event.data === 'COLLISION!!!') {
        this.setState({
          collision: true
        })
      } else if (event.data === 'NO') {
        this.setState({
          collision: false
        })
      } else {
        const message = JSON.parse(event.data)
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
          ctx.beginPath();
          ctx.arc(player.position.x, player.position.y, 10, 0, 2 * Math.PI)
          ctx.fill()
          ctx.beginPath();
          ctx.lineWidth = 5;
          ctx.moveTo(player.position.x, player.position.y);

          if (player.orientation === 'left') {
            ctx.lineTo(player.position.x - 20, player.position.y)
          }
          if (player.orientation === 'right') {
            ctx.lineTo(player.position.x + 20, player.position.y)
          }
          if (player.orientation === 'up') {
            ctx.lineTo(player.position.x, player.position.y - 20)
          }
          if (player.orientation === 'down') {
            ctx.lineTo(player.position.x, player.position.y + 20)
          }
          ctx.stroke()
        }
        if (bullets) {
          for (let bullet of bullets) {
            ctx.beginPath();
            ctx.arc(bullet.position.x, bullet.position.y, 2, 0, 2 * Math.PI)
            ctx.fill()
          }

        }

      }


    }

    window.addEventListener('keydown', this.handleKeys.bind(this, true));
    window.addEventListener('keyup',   this.handleKeys.bind(this, false));

    setInterval(() => {
      this.socket.send(JSON.stringify(this.state.keys))
    }, 1000/60)


  }


  render() {
    const collision = this.state.collision && <h1>COLLISION!!!!!!!</h1>
    return(
      <div className="App">
        <canvas ref="canvas" width={1280} height={720} />
        {collision}
      </div>
    )
  }
}

export default App;
