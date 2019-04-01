const Cell = require('./cell');

class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.world = new Array(height);
      for (let i=0; i<height; i++){
        this.world[i] = new Array(width);
        for (let j=0; j<width; j++) this.world[i][j] = new Cell(false, 0);
      }
      this.randomize();
    }
  
    evolveWorld() {
      //let _world = [...Array(5)].map(e => Array(5).fill(true)); This method is slower than classic and make reference between fill objects.
      let _world = new Array(this.height);
      for (let i=0; i<this.height; i++){
        _world[i] = new Array(this.width);
        for (let j=0; j<this.width; j++) _world[i][j] = new Cell(false, 0);
      }
  
      for(let i=0; i<this.world.length; i++) {
        for (let j=0; j<this.world[0].length; j++) {
          let tmp = this.evolveCell(i, j, true);
          _world[i][j].alive = tmp['alive_nextgen'];
          _world[i][j].color = tmp['color'];
        }
      }
      this.world = _world;
    }
  
    evolveCell(y, x, multiplayer) {
      let tmp = this.countNeighbours(y, x, multiplayer);
      let count = tmp['count'];
      let dominantColor = tmp['dominantColor'];
      let alive = this.world[y][x].alive;
      let alive_nextgen = true;
  
      if (alive) {
        if (count < 2 || count > 3) {
          alive_nextgen = false;
        }
      }
      else {
        if (count != 3) {
          alive_nextgen = false;
        }
      }
  
      let ret;
      if (multiplayer)  ret = { 'alive_nextgen': alive_nextgen, 'color': dominantColor };
      else              ret = { 'alive_nextgen': alive_nextgen, 'color': 0 };
  
      //if (!alive && alive_nextgen) 			this.score+=2;
      //else if (alive && !alive_nextgen)	this.score-=1;
  
      return ret;
    }
  
    countNeighbours(y, x, multiplayer) {
      let count = 0;
      let dominantColor = 0;
      let rgb = [0, 0, 0, 0];
      let boundx = this.world[0].length-1;
      let boundy = this.world.length-1;
  
      let c = (value) => {
          let ret = value;
          if (value == -1) ret = this.width-1;
          else if (value == this.width) ret = 0;
          return ret;
      };
  
      if (this.world[c(y)][c(x-1)].alive)   { count++; rgb[this.world[c(y)][c(x-1)].color]++; } //W
      if (this.world[c(y-1)][c(x-1)].alive) { count++; rgb[this.world[c(y-1)][c(x-1)].color]++; } //NW
      if (this.world[c(y-1)][c(x)].alive)   { count++; rgb[this.world[c(y-1)][c(x)].color]++; } //N
      if (this.world[c(y-1)][c(x+1)].alive) { count++; rgb[this.world[c(y-1)][c(x+1)].color]++; } //NE
      if (this.world[c(y)][c(x+1)].alive)   { count++; rgb[this.world[c(y)][c(x+1)].color]++; } //E
      if (this.world[c(y+1)][c(x+1)].alive) { count++; rgb[this.world[c(y+1)][c(x+1)].color]++; } //SE
      if (this.world[c(y+1)][c(x)].alive)   { count++; rgb[this.world[c(y+1)][c(x)].color]++; } //S
      if (this.world[c(y+1)][c(x-1)].alive) { count++; rgb[this.world[c(y+1)][c(x-1)].color]++; } //SW
  
      if (count == 2) dominantColor = this.world[y][x].color;
      else if (count == 3)
      {
        dominantColor = Math.max(...rgb);
  
        if (dominantColor > 1) {
          switch(dominantColor) {
            case rgb[0]: dominantColor = 0; break;  // Neutral
            case rgb[1]: dominantColor = 1; break;  // Player 1
            case rgb[2]: dominantColor = 2; break;  // Player 2
            case rgb[3]: dominantColor = 3; break;  // Player 3
          }
        }
        else dominantColor = 0;
      }
  
      let ret;
  
      if(multiplayer) ret = {'count': count, 'dominantColor': dominantColor};
      else            ret = {'count': count, 'dominantColor': 0};
  
      return ret;
    }
  
    randomize() {
      for(let i=0; i<this.world.length; i++) {
        for (let j=0; j<this.world[0].length; j++) {
          this.world[i][j].alive = Boolean(Math.round(Math.random()));
          this.world[i][j].color = Math.floor(Math.random() * 3) + 1;
        }
      }
    }
  
    clean() {
      for(let i=0; i<this.world.length; i++) {
        for (let j=0; j<this.world[0].length; j++) {
          this.world[i][j].alive = false;
          this.world[i][j].color = Math.floor(Math.random() * 3) + 1;
        }
      }
    }
  
    setSize(size) {
      this.width = size; this.height = size;
      let _world = new Array(size);
      for (let i=0; i<size; i++){
        _world[i] = new Array(size);
        for (let j=0; j<size; j++) _world[i][j] = new Cell(false, 0);
      }
  
      this.world = _world;
      this.randomize();
    }
  }

  module.exports = Game;