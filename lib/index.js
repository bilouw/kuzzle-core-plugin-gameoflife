/**
 * Plugins must be valid Node.js requirable modules,
 * usually shipped as a directory and containing either:
 *
 *  - an `index.js` file in its root directory, exporting a Javascript class
 *  - a well-formed `package.json` file in its root directory,
 *    specifying the path of the main requirable file in the `main` field.
 *
 * To determine the Plugin name, Kuzzle looks for the `name` field
 * in the `manifest.json` file.
 * @deprecated  - If no `manifest.json` file is found, Kuzzle will fall back
 * to the `package.json` file, if there is one. Otherwise, an exception is thrown
 * and Kuzzle will fail to start.
 *
 * @see https://docs.kuzzle.io/plugins-reference/plugins-creation-prerequisites/
 */
class CorePlugin {
  /* eslint-disable no-unused-vars */
  /* eslint-disable no-console */

  /**
   * Create a new instance of CorePlugin
   *
   * Workflow:
   *  - Kuzzle loads plugins in <kuzzle install dir>/plugins/enabled/* and
   *     instantiate them, also configuration and manifest.json files are read.
   *  - The "init" function is called
   *  - The plugin manager registers all plugin features into Kuzzle:
   *    hooks, pipes, authentication strategies and custom API routes
   *
   * Kuzzle aborts its own start sequence if any error occurs during
   * plugins initialization.
   *
   */
  constructor () {
    /**
     * The plugin context is provided by Kuzzle as an argument to the
     * "init" function
     *
     * @type {PluginContext}
     */
    this.context = null;

    /**
     * Here is a good place to set default configuration values.
     * You can merge them with overridden values, provided by Kuzzle
     * as an argument to the "init" function.
     *
     * @type {Object}
     */
    this.config = {
      param: '<default value>'
    };

    /**
     * Specifies a set of events along with the asynchronous
     * listener functions they trigger.
     *
     * The function "asyncListener" will be called whenever
     * the following events are triggered:
     * - "document:beforeCreateOrReplace"
     * - "document:beforeReplace"
     * - "document:beforeUpdate"
     *
     * The function "asyncOverloadListener" will be called whenever the event
     * "core:overload" is triggered.
     *
     * @type {Object}
     *
     * @see https://docs.kuzzle.io/plugins-reference/plugins-features/adding-hooks/
     * @see https://docs.kuzzle.io/kuzzle-events/
     */
    this.hooks = {
      'core:kuzzleStart':    'onKuzzleStart'
    };

    this.controllers = {
      worldController: {
        randomizeWorld: 'randomizeWorld',
        setWorldCell:   'setWorldCell',
        updateWorld:    'updateWorld',
        setWorldSize:   'setWorldSize',
        setPlaying:     'setPlaying',
        cleanWorld:     'cleanWorld'
      }
    };

    this.routes = [
      {verb: 'post', url: '/randomize', controller: 'worldController', action: 'randomizeWorld'},
      {verb: 'post', url: '/setWorldCell', controller: 'worldController', action: 'setWorldCell'},
      {verb: 'post', url: '/updateWorld', controller: 'worldController', action: 'updateWorld'},
      {verb: 'post', url: '/setWorldSize', controller: 'worldController', action: 'setWorldSize'},
      {verb: 'post', url: '/setPlaying', controller: 'worldController', action: 'setPlaying'},
      {verb: 'post', url: '/cleanWorld', controller: 'worldController', action: 'cleanWorld'}
    ];

    this.game = new Game(50, 50);
    this.playing = true;
  } 

  /**
   * Initializes the plugin with configuration and context.
   *
   * @param {Object} customConfig - This plugin custom configuration
   * @param {Object} context      - A restricted gateway to the Kuzzle API
   *
   * @see https://docs.kuzzle.io/plugins-reference/plugins-creation-prerequisites/#plugin-init-function
   * @see https://docs.kuzzle.io/plugins-reference/managing-plugins#configuring-plugins
   * @see https://docs.kuzzle.io/plugins-reference/plugins-context/
   */
  init (customConfig, context) {
    this.config = Object.assign(this.config, customConfig);
    this.context = context;
  }

  update() {
    this.game.evolveWorld();
    this.setDocument(this.context);
  }

  async updateWorld() {
    this.update();
    return Promise.resolve('World Updated ...');
  }

  async randomizeWorld() {
    this.game.randomize();
    this.setDocument(this.context);
    console.log ('World Randomized by client ...');

    return Promise.resolve('World Randomize ...');
  }

  async setPlaying() {
    this.playing = !this.playing;
    return Promise.resolve('this.playing changed ...');
  }

  async cleanWorld() {
    this.game.clean();
    this.setDocument(this.context);
    return Promise.resolve('World Cleaned ...');
  }

  async setWorldCell(request) {
    let x = request.input.args.x; 
    let y = request.input.args.y;
    console.log('setCell ' + y);

    this.game.world[y][x].alive = !this.game.world[y][x].alive;
    this.setDocument(this.context);

    return Promise.resolve('Cell Modified ...');
  }

  async setWorldSize(request) {
    let size = request.input.args.size;

    this.game.setSize(size);
    this.setDocument(this.context);

    return Promise.resolve('World Size changed ...');
  }
  
  async setDocument(context) {
    var request = new context.constructors.Request({
      index: 'gameoflife',
      collection: 'worlds',
      controller: 'document',
      action: 'createOrReplace',
      _id: 'world1',
      body: {...this.game.world}
    });
    
    this.request(context, request);
  }

  async request(context, request) {
    try {
      // "request" is the updated Request object
      // The API response is accessed through "request.response"
      request = await context.accessors.execute(request);
    } catch (error) {
      // "error" is a KuzzleError objectc
      console.log(error);
    }
  }
  
  async getDocument(context) {
    var request = new context.constructors.Request({
      index: 'gameoflife',
      collection: 'worlds',
      controller: 'document',
      action: 'get',
      _id: 'AWmy2bcWR7blZrod-VhX'
    });
    this.request(context, request)
  }

  /**
   * An example of an asynchronous listener function. It is triggered
   * by the `hooks` property defined above, and does not have return anything.
   * It is called asynchronously and Kuzzle does not wait for it to return.
   *
   * The event it is listening is sending a Request object to its listeners.
   * Check each event documentation to make sure your listener handle the right
   * payload type: https://docs.kuzzle.io/kuzzle-events/plugin-events/
   *
   * @param {Request} request The request that triggered the event
  */
  onKuzzleStart(request) {
    this.setDocument(this.context);
    setInterval(() => {
      if (this.playing) this.update();
    }, 500);
  }
}

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

class Cell {
  constructor(alive, color) {
    this.alive = alive;
    this.color = color;
  }
}

module.exports = CorePlugin;
