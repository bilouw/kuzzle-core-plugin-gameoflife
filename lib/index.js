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

const Game = require('./game');

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
    this.setDocument();
  }

  async updateWorld() {
    this.update();
    //return Promise.resolve('World Updated ...');
  }

  async randomizeWorld() {
    this.game.randomize();
    this.setDocument();

    //return Promise.resolve('World Randomize ...');
  }

  async setPlaying() {
    this.playing = !this.playing;
    //return Promise.resolve('this.playing changed ...');
  }

  async cleanWorld() {
    this.game.clean();
    this.setDocument();
    //return Promise.resolve('World Cleaned ...');
  }

  async setWorldCell(request) {
    let x = request.input.args.x; 
    let y = request.input.args.y;
    console.log('setCell ' + y);

    this.game.world[y][x].alive = !this.game.world[y][x].alive;
    this.setDocument();

    //return Promise.resolve('Cell Modified ...');
  }

  async setWorldSize() {
    let size = request.input.args.size;

    this.game.setSize(size);
    this.setDocument();

    //return Promise.resolve('World Size changed ...');
  }
  
  async setDocument() {
    await this.context.accessors.sdk.document.createOrReplace(
      'gameoflife',
      'worlds',
      'world1',
      {...this.game.world}
    );
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

module.exports = CorePlugin;
