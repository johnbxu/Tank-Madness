import React, { Component } from 'react';
import ReactDOM from 'react-dom'
import grass from './assets/grass.png'
import './App.css';
import Player from './Player'
import random from './randomCoord'

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
      keys: {
        left  : 0,
        right : 0,
        up    : 0,
        down  : 0,
        space : 0,
      }
    }
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
    window.addEventListener('keydown', this.handleKeys.bind(this, true));
    window.addEventListener('keyup',   this.handleKeys.bind(this, false));

    const canvas = ReactDOM.findDOMNode(this.refs.canvas)
    console.log(canvas)
    const ctx = canvas.getContext("2d")
    const img = new Image()
    img.src = grass

    const player1 = new Player({
      position: random()
    })

    const player2 = new Player({
      position: random()
    })

    console.log(player1.position)
    img.onload = () => {
      const pattern = ctx.createPattern(img, 'repeat')

      ctx.rect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = pattern
      ctx.fill()

      ctx.fillStyle = 'black'
      ctx.fillRect(player1.position.x, player1.position.y, 30, 50)
      ctx.fillRect(player2.position.x, player2.position.y, 30, 50)
    }
  }


  render() {
    return(
      <div className="App">
        <canvas ref="canvas" width={1280} height={720} />
      </div>
    )
  }
}

export default App;
