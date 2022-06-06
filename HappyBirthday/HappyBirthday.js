'use strict';

// Events
function onLoad() {
   const page = new Page();
   page.initialize();
}
window.addEventListener('load', onLoad);

/**
 * LOGLEVELs:
 * 0 - disable all logging
 * 1 - page events
 * 2 - important events
 * 3 - animation status
 * 4 - animation events
 * 5 - all animation events
 * 6 - HTML events
 * 7 - all HTML manipulation
 */
let LOGLEVEL = 1;
let LOGTHIS = false;
let LOGOTHER = false;

/**
 * Log debug output.
 *
 * @template T
 * @param {number} level the loglevel. Higher level means needs to be more verbose.
 * @param {object} thisObj logged if `LOGTHIS` is enabled.
 * @param {string} text text to log.
 * @param {T} otherObj logged if `LOGOTHER` is enabled.
 * @returns {T} `otherObj` for convenience.
 */
function log(level, thisObj, text, otherObj) {
   if (LOGLEVEL < level) return;
   const log = [];
   log.push('[LVL:' + level + ']');
   if (LOGTHIS) log.push(thisObj);
   log.push(text);
   if (LOGOTHER && otherObj) log.push(otherObj);
   console.log(...log);
   return otherObj;
}

// Constants
/** The autoplay mode starts to cheat when a piece's pivot element stops at that height. */
const AUTOPLAYHEIGHT = 15;
/**
 * `x` and `y` coordinates in the board.
 *
 * @typedef {[x:number,y:number]} Coordinates
 */
/** Keyboard events are ignored for these keys. (Note that this is different from `DISPATCHIGNOREKEYCODES`.) */
const DISPATCHIGNOREKEYS = Object.freeze(['Alt', 'Control', 'Meta', 'Shift']);
/** Keyboard events are ignored for these key codes. (Note that this is different from `DISPATCHIGNOREKEYS`.) */
const DISPATCHIGNOREKEYCODES = Object.freeze([]);
/**
 * Called when an animation finishes.
 *
 * @typedef {()=>void} DoneCallback
 */
/**
 * A callback function called when a timed, mouse or keyboard event is dispatched.
 *
 * @typedef {(event?:MouseEvent|KeyboardEvent)=>boolean} EventCallback
 */
/**
 * A callback function called when a timed event is dispatched.
 *
 * @typedef {()=>boolean} TimedCallback
 */
/**
 * A callback function called when a mouse event is dispatched.
 *
 * @typedef {(event:MouseEvent)=>boolean} MouseCallback
 */
/**
 * A callback function called when a keyboard event is dispatched.
 *
 * @typedef {(event:KeyboardEvent)=>boolean} KeyboardCallback
 */
/** Maximum number of tries for piece insertions. */
const INSERTIONTRIES = 16;
/**
 * An object containing piece information.
 *
 * @typedef {{cls:string,fg:string,bg:string,name:string,pivot:Coordinates,rotation:number,rotationEnabled:boolean,shape:boolean[][]}} Piece
 * @type {Piece[]}
 */
const PIECES = [
   {
      cls: 'blockI',
      fg: 'black',
      bg: '#00f0f0',
      name: 'I',
      pivot: [1, 0],
      rotation: 0,
      rotationEnabled: true,
      shape: [[true, true, true, true]],
   },
   {
      cls: 'blockJ',
      fg: 'white',
      bg: '#0000f0',
      name: 'J',
      pivot: [1, 1],
      rotation: 0,
      rotationEnabled: true,
      shape: [
         [false, true],
         [false, true],
         [true, true],
      ],
   },
   {
      cls: 'blockL',
      fg: 'black',
      bg: '#f0a000',
      name: 'L',
      pivot: [0, 1],
      rotation: 0,
      rotationEnabled: true,
      shape: [
         [true, false],
         [true, false],
         [true, true],
      ],
   },
   {
      cls: 'blockO',
      fg: 'black',
      bg: '#f0f000',
      name: 'O',
      pivot: [0, 0],
      rotation: 0,
      rotationEnabled: false,
      shape: [
         [true, true],
         [true, true],
      ],
   },
   {
      cls: 'blockS',
      fg: 'black',
      bg: '#00f000',
      name: 'S',
      pivot: [1, 0],
      rotation: 0,
      rotationEnabled: true,
      shape: [
         [false, true, true],
         [true, true, false],
      ],
   },
   {
      cls: 'blockT',
      fg: 'white',
      bg: '#a000f0',
      name: 'T',
      pivot: [1, 1],
      rotation: 0,
      rotationEnabled: true,
      shape: [
         [false, true, false],
         [true, true, true],
      ],
   },
   {
      cls: 'blockZ',
      fg: 'black',
      bg: '#f00000',
      name: 'Z',
      pivot: [1, 0],
      rotation: 0,
      rotationEnabled: true,
      shape: [
         [true, true, false],
         [false, true, true],
      ],
   },
];
const TEXT = 'Herzlichen Glückwunsch zum Geburtstag!!'; // .replaceAll(' ', '').toUpperCase();
const TEXTCONSTANTS = {
   empty: '',
   block: '&#9632;',
   space: '&nbsp;',
};
/**
 * An object with information about the transformation result.
 *
 * @typedef {Readonly<{success:boolean,collision:boolean,invalid:boolean,outOfBounds:boolean,outOfTries:boolean,message:string}>} TransformResult
 */
/**
 * Default transformation results.
 *
 * @type {Readonly<{success:TransformResult,collision:TransformResult,invalidRotation:TransformResult,outOfBounds:TransformResult,outOfTries:TransformResult}>}
 */
const TRANSFORMRESULTS = Object.freeze({
   success: Object.freeze({
      success: true,
      collision: false,
      invalid: false,
      outOfBounds: false,
      outOfTries: false,
      message: 'Transformation successful.',
   }),
   collision: Object.freeze({
      success: false,
      collision: true,
      invalid: false,
      outOfBounds: false,
      outOfTries: false,
      message: 'Transformation collided with non-empty cells.',
   }),
   invalidRotation: Object.freeze({
      success: false,
      collision: false,
      invalid: true,
      outOfBounds: false,
      outOfTries: false,
      message: 'Invalid transformation: Tried to rotate unrotatable piece.',
   }),
   outOfBounds: Object.freeze({
      success: false,
      collision: false,
      invalid: false,
      outOfBounds: true,
      outOfTries: false,
      message: 'Transformation went out of bounds.',
   }),
   outOfTries: Object.freeze({
      success: false,
      collision: false,
      invalid: false,
      outOfBounds: false,
      outOfTries: true,
      message: 'Exceeded maximum number of tries for transformation.',
   }),
});

// Classes
class MoreMath {
   /**
    * Generate a random integer in the interval [min, max).
    *
    * Solution borrowed from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#getting_a_random_integer_between_two_values
    *
    * @param {number} min inclusive value.
    * @param {number} max exclusive value.
    * @returns {number} a random integer in the interval [min, max).
    */
   static getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
   }

   /**
    * Calculates the sine of the given angle in radian and rounds it to the nearest integer.
    *
    * @param {number} radian 0, pi/2, pi, 3pi/2, ...
    * @returns {number} the rounded sine of `radian`.
    */
   static sinRound(radian) {
      return Math.round(Math.sin(radian));
   }

   /**
    * Calculates the cosine of the given angle in radian and rounds it to the nearest integer.
    *
    * @param {number} radian 0, pi/2, pi, 3pi/2, ...
    * @returns {number} the rounded cosine of `radian`.
    */
   static cosRound(radian) {
      return Math.round(Math.cos(radian));
   }

   /**
    * Calculates the sine of the given angle in multiples of `pi/2` and rounds it to the nearest integer.
    *
    * @param {number} rotation the number of rotations with angle `pi/2`.
    * @returns {0|1|-1} `MoreMath.sinRound(i * Math.PI / 2)`
    */
   static sinRotation(rotation) {
      if (!Number.isInteger(rotation)) {
         throw new Error(`Invalid rotation "${rotation}" given.`);
      }
      switch (MoreMath.mod(rotation, 4)) {
         case 0:
         case 2:
            return 0;
         case 1:
            return 1;
         case 3:
            return -1;
         default:
            throw new Error("Turns out math is not JavaScript's strong suit.");
      }
   }

   /**
    * Calculates the cosine of the given angle in multiples of `pi/2` and rounds it to the nearest integer.
    *
    * @param {number} rotation the number of rotations with angle `pi/2`.
    * @returns {0|1|-1} `MoreMath.cosRound(i * Math.PI / 2)`
    */
   static cosRotation(rotation) {
      if (!Number.isInteger(rotation)) {
         throw new Error(`Invalid rotation "${rotation}" given.`);
      }
      switch (MoreMath.mod(rotation, 4)) {
         case 1:
         case 3:
            return 0;
         case 0:
            return 1;
         case 2:
            return -1;
         default:
            throw new Error("Turns out math is not JavaScript's strong suit.");
      }
   }

   /**
    * Calculates `x` modulo `y`.
    *
    * @param {number} x
    * @param {number} y
    * @returns {number} `x` mod `y`
    */
   static mod(x, y) {
      return ((x % y) + y) % y;
   }

   /**
    * Assertion checks for comparing results of `sinRound()`, `sinRotation()` and `cosRound()`, `cosRotation()`.
    *
    * @param {number} maxRotation iterates from `-maxRotation` to `maxRotation`.
    * @throws {Error} if an assertion is violated.
    */
   static _test(maxRotation = 128) {
      for (let i = -maxRotation; i <= maxRotation; i++) {
         let lvalue, rvalue;
         lvalue = MoreMath.sinRound((i * Math.PI) / 2);
         rvalue = MoreMath.sinRotation(i);
         if (lvalue !== rvalue)
            throw new Error(`assertion failed: MoreMath: i=${i}, check=sin, lvalue=${lvalue}, rvalue=${rvalue}!`);

         lvalue = MoreMath.cosRound((i * Math.PI) / 2);
         rvalue = MoreMath.cosRotation(i);
         if (lvalue !== rvalue)
            throw new Error(`assertion failed: MoreMath: i=${i}, check=cos, lvalue=${lvalue}, rvalue=${rvalue}!`);
      }
   }
}

/**
 * Dispatches events in all registered `EventHandler`s.
 */
class EventDispatch {
   /**
    * Create an event handler instance.
    *
    * @param {number} timeoutInterval for timed callbacks.
    */
   constructor(timeoutInterval = 1000) {
      this.timeoutInterval = timeoutInterval;
      /** @type {number} */
      this.timeoutId = null;
      /** @type {AbortController} */
      this.abortController = null;
      /** @type {EventHandler[]} */
      this.timedHandlers = [];
      /** @type {EventHandler[]} */
      this.mouseHandlers = [];
      /** @type {EventHandler[]} */
      this.keyHandlers = [];
   }

   /**
    * Register a `EventHandler`.
    *
    * @param {EventHandler} handler to register.
    * @param {boolean} registerThis whether to register this `EventDispatch` inside the `handler` as well.
    * @returns {EventDispatch} `this`
    */
   registerHandler(handler, registerThis = true) {
      this.updateHandler(handler);
      if (registerThis) {
         handler.registerDispatch(this, false);
      }
      return this;
   }

   /**
    * Unregister a `EventHandler`.
    *
    * @param {EventHandler} handler to unregister.
    * @param {boolean} unregisterThis whether to unregister this `EventDispatch` inside the `handler` as well.
    * @returns {EventDispatch} `this`
    */
   unregisterHandler(handler, unregisterThis = true) {
      if (unregisterThis) {
         handler.unregisterDispatch(this, false);
      }
      this._updateHandlersList(this.timedHandlers, handler, null);
      this._updateHandlersList(this.mouseHandlers, handler, null);
      this._updateHandlersList(this.keyHandlers, handler, null);
      return this;
   }

   /**
    * Update the internal state based on the current configuration of the already registered `EventHandler`.
    *
    * @param {EventHandler} handler to check for configuration changes.
    * @returns {EventDispatch} `this`
    */
   updateHandler(handler) {
      this._updateHandlersList(this.timedHandlers, handler, handler.timed);
      this._updateHandlersList(this.mouseHandlers, handler, handler.mouse);
      this._updateHandlersList(this.keyHandlers, handler, handler.key);
      return this;
   }

   /**
    * **INTERNAL**
    * Update the given `handlers` list by checking the `handler` for changes in the `callback` configuration.
    *
    * @param {EventHandler[]} handlers the list to update.
    * @param {EventHandler} handler to check for.
    * @param {EventCallback} callback from the `handler` corresponding to the `handlers` list.
    */
   _updateHandlersList(handlers, handler, callback) {
      const handlerIndex = handlers.findIndex((obj) => obj === handler);
      if (handlerIndex === -1) {
         if (callback) handlers.push(handler);
      } else {
         if (!callback) handlers.splice(handlerIndex, 1);
      }
   }

   /**
    * Start handling events.
    *
    * @returns {EventDispatch} `this`
    */
   start() {
      if (this.abortController) return this;
      this.abortController = new AbortController();
      document.addEventListener('click', this.handleMouseEvent, { signal: this.abortController.signal });
      document.addEventListener('keydown', this.handleKeyEvent, { signal: this.abortController.signal });
      return this;
   }

   /**
    * Stop handling events.
    *
    * @returns {EventDispatch} `this`
    */
   stop() {
      clearTimeout(this.timeoutId);
      this.abortController.abort();
      this.abortController = null;
      return this;
   }

   /**
    * Stop the current timeout.
    *
    * @returns {EventDispatch} `this`
    */
   stopTimed() {
      clearTimeout(this.timeoutId);
      return this;
   }

   /**
    * Cancel the current timeout and replace it with a new one.
    *
    * @param {number} timeoutInterval the interval in ms for timed events.
    * @returns {EventDispatch} `this`
    */
   retime(timeoutInterval = null) {
      if (timeoutInterval) {
         this.timeoutInterval = timeoutInterval;
      }
      clearTimeout(this.timeoutId);
      this.timeoutId = setTimeout(this.handleTimedEvent, this.timeoutInterval);
      return this;
   }

   /**
    * Handle a timed event.
    */
   handleTimedEvent = () => {
      log(6, this, 'timed event');
      clearTimeout(this.timeoutId);
      this.timedHandlers.some((handler) => handler.timed?.());
      this.timeoutId = setTimeout(this.handleTimedEvent, this.timeoutInterval);
   };

   /**
    * Handle a mouse event.
    *
    * @param {MouseEvent} event
    */
   handleMouseEvent = (event) => {
      event.stopPropagation();
      log(6, this, 'mouse event', event);
      this.mouseHandlers.some((handler) => handler.mouse?.(event));
   };

   /**
    * Handle a keyboard event.
    *
    * @param {KeyboardEvent} event
    */
   handleKeyEvent = (event) => {
      event.stopPropagation();
      if (DISPATCHIGNOREKEYS.includes(event.key)) return;
      if (DISPATCHIGNOREKEYCODES.includes(event.code)) return;
      log(6, this, 'key event', event);
      this.keyHandlers.some((handler) => handler.key?.(event));
   };
}

/**
 * Hold and manage callbacks to register in an `EventDispatch`.
 */
class EventHandler {
   static NEXTID = 0;

   /**
    * Create a callback handler instance with predefined callbacks.
    *
    * @param {{name:string,timed:TimedCallback,mouse:MouseCallback,key:KeyboardCallback}} kwargs Arguments wrapped in an `Object`:
    * @param {string} name of the callback handler
    * @param {TimedCallback} timed callback
    * @param {MouseCallback} mouse event callback
    * @param {KeyboardCallback} key event callback
    */
   constructor({ name, timed, mouse, key }) {
      /** @type {number} */
      this.id = EventHandler.NEXTID++;
      /** @type {string} */
      this.name = name ?? 'EventHandler#' + this.id;
      /** @type {EventDispatch} */
      this.dispatch = null;
      /** @type {TimedCallback} */
      this.timed = timed;
      /** @type {MouseCallback} */
      this.mouse = mouse;
      /** @type {KeyboardCallback} */
      this.key = key;
   }

   /**
    * Register an `EventDispatch`.
    *
    * @param {EventDispatch} dispatch to register.
    * @param {boolean} registerThis whether to register this `EventHandler` inside the `dispatch` as well.
    * @returns {EventHandler} `this`
    */
   registerDispatch(dispatch, registerThis = true) {
      if (this.dispatch) {
         throw new Exception('This event handler is already associated to an EventDispatch.');
      }
      this.dispatch = dispatch;
      if (registerThis) {
         this.dispatch.registerHandler(this, false);
      }
      return this;
   }

   /**
    * Unregister the `EventDispatch` if present.
    *
    * @param {boolean} unregisterThis whether to unregister this `EventHandler` inside the `dispatch` as well.
    * @returns {EventHandler} `this`
    */
   unregisterDispatch(unregisterThis = true) {
      if (!this.dispatch) {
         return;
      }
      if (unregisterThis) {
         this.dispatch.unregisterHandler(this, false);
      }
      this.dispatch = null;
      return this;
   }

   /**
    * **INTERNAL**
    * Update this `EventHandler` in the registered `dispatch` if present.
    *
    * @returns {EventHandler} `this`
    */
   _updateDispatch() {
      if (this.dispatch) this.dispatch.updateHandler(this);
      return this;
   }

   /**
    * Update this `EventHandler` in the registered `dispatch`.
    *
    * Called automatically if a callback is updated.
    * @returns {EventHandler} `this`
    */
   updateDispatch() {
      if (!this.dispatch) {
         throw new Exception('This event handler is not associated to an EventDispatch.');
      }
      this.dispatch.updateHandler(this);
      return this;
   }

   /**
    * (Un-)Register a timed callback. If a callback returns true, later callbacks will not be executed and the timing is stopped.
    *
    * @param {TimedCallback} callback to set or unregister if not given.
    * @returns {EventHandler} `this`
    */
   updateTimedCallback(callback = null) {
      this.timed = callback;
      this._updateDispatch();
      return this;
   }

   /**
    * (Un-)Register a mouse event callback. If a callback returns true, later callbacks will not be executed.
    *
    * @param {MouseCallback} callback to set or unregister if not given.
    * @returns {EventHandler} `this`
    */
   updateMouseCallback(callback = null) {
      this.mouse = callback;
      this._updateDispatch();
      return this;
   }

   /**
    * (Un-)Register a key event callback. If a callback returns true, later callbacks will not be executed.
    *
    * @param {KeyboardCallback} callback to set or unregister if not given.
    * @returns {EventHandler} `this`
    */
   updateKeyCallback(callback = null) {
      this.key = callback;
      this._updateDispatch();
      return this;
   }

   /**
    * Stop the current `dispatch` timeout.
    *
    * @returns {EventHandler} `this`
    */
   stopTimed() {
      this.dispatch.stopTimed();
      return this;
   }

   /**
    * Cancel the current `dispatch` timeout and replace it with a new one.
    *
    * @param {number} timeoutInterval the interval in ms for timed events.
    * @returns {EventHandler} `this`
    */
   retime(timeoutInterval = null) {
      this.dispatch.retime(timeoutInterval);
      return this;
   }
}

/**
 * The state of a `Cell`.
 *
 * @typedef {{cls:string,fg:string,bg:string,text:string,isControlled:boolean,isEmpty:boolean,[other:string]:unknown}} CellState
 */
/**
 * The DOM state of a `Cell`.
 *
 * @typedef {{cls:string,fg:string,bg:string,text:string}} CellDOMState
 */

/**
 * Describes a cell and holds the reference to its corresponding HTML entity.
 */
class Cell {
   /**
    * Create a Cell instance.
    *
    * @param {number} x coordinate.
    * @param {number} y coordinate.
    * @param {CellState} defaultState default state.
    * @param {string} cls the default class attribute.
    * @param {string} fg the default CSS color.
    * @param {string} bg the default CSS background-color.
    * @param {string} text the default HTML text.
    * @param {boolean} isEmpty if the cell is empty by default.
    */
   constructor(x, y, defaultState = null) {
      /** @type {number} */
      this.x = x;
      /** @type {number} */
      this.y = y;
      /** @type {string} */
      this.id = `cell${this.x}x${this.y}`;
      /** @type {CellState} */
      this.defaultState = {
         cls: null,
         fg: null,
         bg: null,
         text: TEXTCONSTANTS.empty,
         isControlled: false,
         isEmpty: true,
         ...defaultState,
      };
      /** @type {CellState} */
      this.state = { ...this.defaultState };
      /** @type {CellDOMState} */
      this.DOMState = {
         cls: null,
         fg: null,
         bg: null,
         text: null,
      };
      /** @type {boolean} */
      this.hasStateUpdated = true;
      /** @type {HTMLSpanElement} */
      this.html_span = null;
   }

   /**
    * Dispatch a redraw event.
    *
    * @returns {boolean} whether something changed.
    */
   dispatchDOMUpdate() {
      if (!this.hasStateUpdated) return false;
      this.hasStateUpdated = false;
      let hasChanged = false;
      if (this.DOMState.cls !== this.state.cls) {
         if (this.state.cls) {
            this.html_span.setAttribute('class', this.state.cls);
         } else {
            this.html_span.removeAttribute('class');
         }
         this.DOMState.cls = this.state.cls;
         hasChanged = true;
      }
      if (this.DOMState.fg !== this.state.fg) {
         this.html_span.style.color = this.state.fg;
         this.DOMState.fg = this.state.fg;
         hasChanged = true;
      }
      if (this.DOMState.bg !== this.state.bg) {
         this.html_span.style.backgroundColor = this.state.bg;
         this.DOMState.bg = this.state.bg;
         hasChanged = true;
      }
      if (this.DOMState.text !== this.state.text) {
         this.html_span.innerHTML = this.state.text;
         this.DOMState.text = this.state.text;
         hasChanged = true;
      }
      if (hasChanged) {
         log(7, this, 'DOM update event');
      }
      return hasChanged;
   }

   /**
    * Create the HTML entities.
    *
    * @returns {HTMLSpanElement} the created HTML entity.
    */
   createHTMLElement() {
      this.html_span = document.createElement('span');
      this.html_span.id = this.id;
      this.dispatchDOMUpdate();
      log(7, this, 'created HTML element');
      return this.html_span;
   }

   /**
    * Update the `defaultState` used for `resetState()`.
    *
    * @param {CellState} newDefaultState an object containing key-value pairs of default state to change.
    * @returns {Cell} `this`
    */
   updateDefaultState(newDefaultState) {
      Object.assign(this.defaultState, newDefaultState);
      return this;
   }

   /**
    * Update the `state` used for the HTML entity.
    *
    * @param {CellState} newState an object containing key-value pairs of state to change.
    * @returns {Cell} `this`
    */
   updateState(newState) {
      Object.assign(this.state, newState);
      this.hasStateUpdated = true;
      return this;
   }

   /**
    * Reset `state` to `defaultState`.
    *
    * @returns {Cell} `this`
    */
   resetState() {
      this.updateState(this.defaultState);
      return this;
   }

   /**
    * Transfer state from this cell to another cell and reset this cell's state.
    *
    * @param {Cell} toCell
    * @returns {Cell} `this`
    */
   transferState(toCell) {
      toCell.updateState(this.state);
      this.resetState();
      return this;
   }

   /**
    * Copies the internal default state.
    *
    * @returns {CellState} a copy of the internal default state.
    */
   copyDefaultState() {
      return { ...this.defaultState };
   }

   /**
    * Copies the internal state.
    *
    * @returns {CellState} a copy of the internal state.
    */
   copyState() {
      return { ...this.state };
   }
}

/**
 * Holds the current board state and the corresponding HTML entity.
 */
class Board {
   /**
    * Creates a Board with the given size.
    *
    * @param {number} cellsX number of cells for the width.
    * @param {number} cellsY number of cells for the height.
    */
   constructor(cellsX, cellsY) {
      /** @type {number} */
      this.cellsX = cellsX;
      /** @type {number} */
      this.cellsY = cellsY;
      /** @type {number} */
      this.insertX = Math.trunc(this.cellsX / 2);
      /** @type {number} */
      this.limitY = this.cellsY - 1;
      /** @type {Cell[][]} */
      this.cellsByRow = [];
      for (let y = this.limitY; 0 <= y; y--) {
         const row = [];
         for (let x = 0; x < this.cellsX; x++) {
            const cell = new Cell(x, y);
            log(7, this, 'created Cell', cell);
            row.push(cell);
         }
         this.cellsByRow.push(row);
      }
      /** @type {Cell[][]} */
      this.cellsByCol = [];
      for (let x = 0; x < this.cellsX; x++) {
         const column = [];
         for (let y = 0; y < this.cellsY; y++) {
            column.push(this.cellsByRow[y][x]);
         }
         this.cellsByCol.push(column);
      }
      /** @type {HTMLDivElement} */
      this.html_board = null;
   }

   /**
    * Create all Cell HTML entities.
    */
   createHTMLElements() {
      this.html_board = document.getElementById('board');
      this.html_board.innerHTML = '';
      for (let y = this.limitY; 0 <= y; y--) {
         const html_column = document.createElement('div');
         for (let x = 0; x < this.cellsX; x++) {
            const html_cell = this.cellsByRow[y][x].createHTMLElement();
            html_column.appendChild(html_cell);
         }
         this.html_board.appendChild(html_column);
      }
   }

   /**
    * Get the cell at the given coordinates.
    *
    * @param {number} x coordinate.
    * @param {number} y coordinate.
    * @returns {Cell|undefined} the cell at the given coordinates or `undefined` if index is out of range.
    */
   getCell(x, y) {
      return this.cellsByRow[this.limitY - y]?.[x];
   }

   /**
    * Get a cell by starting at a base position and offsetting it by the rotated offset.
    *
    * @param {number} baseX coordinate.
    * @param {number} baseY coordinate.
    * @param {number} offsetX coordinate.
    * @param {number} offsetY coordinate.
    * @param {number} rotation in steps of `pi/2`.
    * @returns {Cell|undefined} the cell at the calculated coordinates or `undefined` if a resulting index is out of range.
    */
   getCellByTransformation(baseX, baseY, offsetX, offsetY, rotation) {
      // basePositionVector + RotationMatrix_{rotation * pi / 2} * offsetVector = absolutePositionVector
      return this.getCell(
         baseX + MoreMath.cosRotation(rotation) * offsetX - MoreMath.sinRotation(rotation) * offsetY,
         baseY + MoreMath.sinRotation(rotation) * offsetX + MoreMath.cosRotation(rotation) * offsetY,
      );
   }

   /**
    * Calculate coordinates by starting at a base position and offsetting it by the rotated offset.
    *
    * @param {number} baseX coordinate.
    * @param {number} baseY coordinate.
    * @param {number} offsetX coordinate.
    * @param {number} offsetY coordinate.
    * @param {number} rotation in steps of `pi/2`.
    * @returns {Coordinates} the resulting coordinates.
    */
   getCoordinatesByTransformation(baseX, baseY, offsetX, offsetY, rotation) {
      // basePositionVector + RotationMatrix_{rotation * pi / 2} * offsetVector = absolutePositionVector
      return [
         baseX + MoreMath.cosRotation(rotation) * offsetX - MoreMath.sinRotation(rotation) * offsetY,
         baseY + MoreMath.sinRotation(rotation) * offsetX + MoreMath.cosRotation(rotation) * offsetY,
      ];
   }

   /**
    * Clear all cell contents above a y-coordinate.
    *
    * @param {number} aboveY all cell contents `aboveY` are cleared.
    * @returns {boolean} whether something was cleared.
    */
   clear(aboveY = 20) {
      let hasChanged = false;
      this.cellsByCol.forEach((column) => {
         column.forEach((cell) => {
            if (cell.state.isControlled) return;
            if (cell.y < aboveY) {
               if (cell.resetState().dispatchDOMUpdate()) {
                  hasChanged = true;
               }
            }
         });
      });
      log(3, this, 'something above ' + aboveY + ' was cleared: ' + hasChanged);
      return hasChanged;
   }

   /**
    * Shift all cell contents above a y-coordinate down one row.
    *
    * @param {number} aboveY all cell contents `aboveY` are shifted down one row to the given y-coordinate.
    * @returns {boolean} whether something was shifted down.
    */
   shiftDown(aboveY = 20) {
      let hasChanged = false;
      this.cellsByCol.forEach((column) => {
         /** @type {Cell} */
         let cellDown;
         column.forEach((cell) => {
            if (cell.state.isControlled) return;
            if (cell.y < aboveY) {
               if (!cell.state.isEmpty) {
                  if (cellDown) {
                     cell.transferState(cellDown);
                  } else {
                     cell.resetState();
                  }
                  hasChanged = true;
               }
               cellDown?.dispatchDOMUpdate();
            }
            cellDown = cell;
         });
         cellDown.dispatchDOMUpdate();
      });
      log(3, this, 'something above ' + aboveY + ' was shifted down: ' + hasChanged);
      return hasChanged;
   }

   /**
    * Let all cell contents above a y-coordinate fall down one row.
    *
    * @param {number} aboveY all cell contents `aboveY` fall down one row to the given y-coordinate.
    * @returns {boolean} whether something fell.
    */
   fallDown(aboveY = 19) {
      let hasChanged = false;
      this.cellsByCol.forEach((column) => {
         /** @type {Cell} */
         let cellDown;
         column.forEach((cell) => {
            if (cell.state.isControlled) return;
            if (cell.y < aboveY) {
               if (!cell.state.isEmpty && cellDown?.state.isEmpty) {
                  if (cellDown) {
                     cell.transferState(cellDown);
                  } else {
                     cell.resetState();
                  }
                  hasChanged = true;
               }
               cellDown?.dispatchDOMUpdate();
            }
            cellDown = cell;
         });
         cellDown.dispatchDOMUpdate();
      });
      log(3, this, 'something above ' + aboveY + ' fell: ' + hasChanged);
      return hasChanged;
   }

   /**
    * Remove all full rows and let blocks above fall into them.
    *
    * @returns {number} how many full lines were removed.
    */
   removeFullRows() {
      let found = 0;
      this.cellsByRow.forEach((row) => {
         while (true) {
            if (row.some((cell) => cell.state.isControlled || cell.state.isEmpty)) {
               return;
            } else {
               row.forEach((cell) => cell.resetState());
               this.fallDown(row[0].y);
               row.forEach((cell) => cell.dispatchDOMUpdate());
               found++;
            }
         }
      });
      return found;
   }

   /**
    * Determine the height / y-coordinate of the heighest filled cell.
    *
    * @returns {number} the height / y-coordinate of the heighest filled cell.
    */
   getMaxHeight() {
      let ret = 0;
      this.cellsByCol.forEach((column) => {
         let height = 0;
         column.forEach((cell, rowIndex) => {
            if (!cell.state.isControlled && !cell.state.isEmpty) height = rowIndex;
         });
         if (ret < height) {
            ret = height;
         }
      });
      return ret;
   }

   /**
    * Determine the index / x-coordinate of a column with the lowest height. (Height being the y-coordinate of the highest filled cell in that column.)
    *
    * @returns {number} the column index / x-coordinate of one of the lowest columns.
    */
   findLowColumn() {
      let lowestX = 0;
      let lowestY = this.cellsY;
      this.cellsByCol.forEach((column, colIndex) => {
         let curY = -1;
         column.forEach((cell, rowIndex) => {
            if (!cell.state.isControlled && !cell.state.isEmpty) curY = rowIndex;
         });
         if (curY < lowestY || (curY === lowestY && colIndex <= this.insertX)) {
            lowestX = colIndex;
            lowestY = curY;
         }
      });
      return lowestX;
   }
}

/**
 * Tracks the location of a moving, controllable piece.
 */
class PieceController {
   /**
    * Creates a PieceController instance.
    *
    * @param {Board} board that should be controlled.
    */
   constructor(board) {
      /** @type {Board} */
      this.board = board;
      /** @type {Cell[]} */
      this.pieceCells = [];
      /** @type {Set<Cell>} */
      this.transactionCells = new Set();
      /** @type {number} */
      this.textIndex = 0;
      /** @type {string[]} */
      this.textChars = [];
      this.uncontrol();
      this.getRandomPiece();
   }

   /**
    * Log the result of a transformation.
    *
    * @template T
    * @param {string} text to log.
    * @param {T} result that should be logged and returned.
    * @returns {T} `result`
    */
   _log(text, result) {
      log(3, this, text, result);
      return result;
   }

   /**
    * Uncontrol the currently controlled piece.
    */
   uncontrol() {
      this.pieceCells.forEach((cell) => {
         cell.updateState({ isControlled: false });
      });
      this.pieceCells.length = 0;
      this.transactionCells.clear();
      this.textChars.length = 0;
      /** @type {Piece} */
      this.piece = null;
      /** @type {Coordinates} */
      this.pivotCoords = null;
      /** @type {number} */
      this.rotation = null;
   }

   /**
    * Choose a random piece from the `PIECES` list.
    *
    * @returns {Piece} a random piece from the `PIECES` list.
    */
   getRandomPiece() {
      const ret = this.nextPiece;
      const pieceIndex = MoreMath.getRandomInt(0, PIECES.length);
      const piece = PIECES[pieceIndex];
      this.nextPiece = piece;
      return ret;
   }

   /**
    * Get the next character from `TEXT`.
    *
    * @param {number} charIndex the character to get.
    * @returns {string} the next character from `TEXT`.
    */
   getTextChar(charIndex) {
      if (!TEXT) return TEXTCONSTANTS.empty;
      while (this.textChars.length <= charIndex) {
         const char = TEXT[this.textIndex++];
         if (this.textIndex === TEXT.length) {
            this.textIndex = 0;
         }
         this.textChars.push(char);
      }
      return this.textChars[charIndex];
   }

   /**
    * Generates an `Array` of `Cell`s where the piece would be after the given transformation.
    *
    * @param {number} offsetX coordinate.
    * @param {number} offsetY coordinate.
    * @param {number} offsetRotation in steps of `pi/2`.
    * @param {Cell[]|null} result optional `Cell[]` to add the cells to.
    * @returns {Cell[]|null} `result` if given, a new `Cell[]` otherwise or `null` if a resulting cell index is out of range.
    */
   getCells(offsetX = 0, offsetY = 0, offsetRotation = 0, result = null) {
      if (result) {
         result.length = 0;
      } else {
         result = [];
      }
      if (this.piece === null)
         throw new Error('assertion failed: PieceController.getCells(): No piece is currently being controlled.');
      if (offsetRotation && !this.piece.rotationEnabled)
         throw new Error(
            'assertion failed: PieceController.getCells(): Refusing to rotate piece with disabled rotation.',
         );
      const baseX = this.pivotCoords[0] + offsetX;
      const baseY = this.pivotCoords[1] + offsetY;
      const [pivotX, pivotY] = this.piece.pivot;
      const rotation = this.rotation + offsetRotation;
      const success = this.piece.shape.every((shapeRow, rowIndex) =>
         shapeRow.every((shapeCell, colIndex) => {
            if (!shapeCell) return true;
            const cell = this.board.getCellByTransformation(
               baseX,
               baseY,
               colIndex - pivotX,
               rowIndex - pivotY,
               rotation,
            );
            if (cell) {
               result.push(cell);
               return true;
            } else {
               result.length = 0;
               return false;
            }
         }),
      );
      if (success) {
         return result;
      } else {
         return null;
      }
   }

   /**
    * Draws the currently controlled piece into the board.
    *
    * Note that to see the changes, you need to update the DOM using `this.dispatchTransaction()`.
    */
   draw() {
      this.pieceCells.forEach((cell, cellIndex) => {
         if (!cell.state.isEmpty)
            throw new Error('assertion failed: PieceController.draw(): Refusing to draw over full cells.');
         cell.updateState({
            cls: 'block ' + this.piece.cls,
            text: this.getTextChar(cellIndex),
            isControlled: true,
            isEmpty: false,
         });
         this.transactionCells.add(cell);
      });
   }

   /**
    * Erases the currently controlled piece from the board.
    *
    * Note that to see the changes, you need to update the DOM using `this.dispatchTransaction()`.
    */
   erase() {
      this.pieceCells.forEach((cell) => {
         cell.resetState();
         this.transactionCells.add(cell);
      });
   }

   /**
    * Dispatches the DOM changes in the board for the current transaction.
    *
    * The "current transaction" refers to changes made by `this.draw()` and `this.erase()`.
    */
   dispatchTransaction() {
      this.transactionCells.forEach((cell) => cell.dispatchDOMUpdate());
      this.transactionCells.clear();
   }

   /**
    * Inserts a new piece into the board and starts to control it.
    *
    * If `nearX` is too close to the left or right border for the piece to fit, it will be shifted towards the center.
    *
    * If there were too many shifts and the piece still doesn't fit, nothing is inserted and `TRANSFORMRESULTS.outOfTries` returned.
    *
    * If there is a collision with another piece while checking the space requirements, nothing is inserted and `TRANSFORMRESULTS.collision` returned.
    *
    * @param {Piece} piece definition object.
    * @param {number} nearX insertion point for the pivot. Defaults to the `Board`'s default insertion column `this.board.insertX`.
    * @returns {TransformResult} the result of the insertion.
    */
   insertNew(piece, nearX = null) {
      nearX = nearX ?? this.board.insertX;
      let nearY = 0;
      const [pivotX, pivotY] = piece.pivot;
      for (let i = 0; i < INSERTIONTRIES; i++) {
         let success = true;
         this.pieceCells.length = 0;
         const done = piece.shape.every((shapeRow, rowIndex) =>
            shapeRow.every((shapeCell, colIndex) => {
               if (!shapeCell) return true;
               const [curX, curY] = this.board.getCoordinatesByTransformation(
                  nearX,
                  nearY,
                  colIndex - pivotX,
                  rowIndex - pivotY,
                  piece.rotation,
               );
               if (curX < 0 || this.board.cellsX <= curX || curY < 0) {
                  if (curX < 0) {
                     nearX += 1;
                  } else if (this.board.cellsX <= curX) {
                     nearX -= 1;
                  }
                  if (curY < 0) {
                     nearY += 1;
                  }
                  return false;
               }
               const cell = this.board.getCell(curX, curY);
               if (cell.state.isEmpty) {
                  this.pieceCells.push(cell);
               } else {
                  success = false;
               }
               return true;
            }),
         );
         if (done) {
            if (success) {
               this.piece = piece;
               this.pivotCoords = [nearX, nearY];
               this.rotation = piece.rotation;
               this.draw();
               this.dispatchTransaction();
               return this._log('insertion success', TRANSFORMRESULTS.success);
            } else {
               return this._log('collision on insert', TRANSFORMRESULTS.collision);
            }
         }
      }
      return this._log('out of tries while inserting', TRANSFORMRESULTS.outOfTries);
   }

   /**
    * Inserts a new random piece into the board and starts to control it.
    *
    * If `nearX` is too close to the left or right border for the piece to fit, it will be shifted towards the center.
    *
    * If there were too many shifts and the piece still doesn't fit, nothing is inserted and `TRANSFORMRESULTS.outOfTries` returned.
    *
    * If there is a collision with another piece while checking the space requirements, nothing is inserted and `TRANSFORMRESULTS.collision` returned.
    *
    * @param {number} nearX insertion point for the pivot. Defaults to the `Board`'s default insertion column `this.board.insertX`.
    * @returns {TransformResult} the result of the insertion.
    */
   insertRandom(nearX = null) {
      const piece = this.getRandomPiece();
      return this.insertNew(piece, nearX);
   }

   /**
    * Transform the currently controlled piece into the given cells if there is enough space.
    *
    * **NOTE** that you **must** manually update the pivot coordinates on success.
    *
    * Checks the space, erases the old piece, draws the new piece and dispatches the transaction.
    *
    * If there is a collision with another piece while checking the space requirements, nothing is transformed and `TRANSFORMRESULTS.collision` returned.
    *
    * @param {Cell[]} newCells the new `Cell`s to transform into.
    * @param {boolean} autoDispatch whether the transaction should be dispatched automatically. (default: `true`)
    * @returns {TransformResult} the result of the transformation.
    * @see `PieceController.transform()` for controlled transformations.
    */
   transformInto(newCells, autoDispatch = true) {
      const success = newCells.every((cell) => cell.state.isEmpty || this.pieceCells.includes(cell));
      if (!success) return this._log('transform collision', TRANSFORMRESULTS.collision);
      this.erase();
      this.pieceCells = newCells;
      this.draw();
      if (autoDispatch) this.dispatchTransaction();
      return this._log('transformation success', TRANSFORMRESULTS.success);
   }

   /**
    * Transform the currently controlled piece into the given cells if there is enough space.
    *
    * Checks the space, erases the old piece, draws the new piece, dispatches the transaction and updates the pivot coordinates. There is no need to call any other methods beside this one to animate a transformation.
    *
    * If the transformation has (parts) of the piece leave the board, nothing is transformed and `TRANSFORMRESULTS.outOfBounds` returned.
    *
    * If a rotation is part of the transformation, but the controlled piece can't be rotated, nothing is transformed and `TRANSFORMRESULTS.invalidRotation` returned.
    *
    * If there is a collision with another piece while checking the space requirements, nothing is transformed and `TRANSFORMRESULTS.collision` returned.
    *
    * @param {number} offsetX coordinate.
    * @param {number} offsetY coordinate.
    * @param {number} offsetRotation in steps of `pi/2`.
    * @param {boolean} autoDispatch whether the transaction should be dispatched automatically. (default: `true`)
    * @returns {TransformResult} the result of the transformation.
    * @see `PieceController.transformInto()` for uncontrolled transformations.
    */
   transform(offsetX = 0, offsetY = 0, offsetRotation = 0, autoDispatch = true) {
      if (offsetRotation && !this.piece.rotationEnabled) {
         return this._log('tried to rotate unrotatable piece', TRANSFORMRESULTS.invalidRotation);
      }
      const newCells = this.getCells(offsetX, offsetY, offsetRotation);
      if (!newCells) return this._log('transform out of bounds', TRANSFORMRESULTS.outOfBounds);
      const result = this.transformInto(newCells, autoDispatch);
      if (result.success) {
         this.pivotCoords[0] += offsetX;
         this.pivotCoords[1] += offsetY;
         this.rotation += offsetRotation;
      }
      return result;
   }

   /**
    * Move the piece down.
    *
    * There is no need to call any other methods to animate this transformation.
    *
    * @returns {TransformResult} the result of the move.
    */
   moveDown() {
      return this.transform(0, 1);
   }

   /**
    * Move the piece up.
    *
    * There is no need to call any other methods to animate this transformation.
    *
    * @returns {TransformResult} the result of the move.
    */
   moveUp() {
      return this.transform(0, -1);
   }

   /**
    * Move the piece right.
    *
    * There is no need to call any other methods to animate this transformation.
    *
    * @returns {TransformResult} the result of the move.
    */
   moveRight() {
      return this.transform(1, 0);
   }

   /**
    * Move the piece left.
    *
    * There is no need to call any other methods to animate this transformation.
    *
    * @returns {TransformResult} the result of the move.
    */
   moveLeft() {
      return this.transform(-1, 0);
   }

   /**
    * Rotate the piece right.
    *
    * There is no need to call any other methods to animate this transformation.
    *
    * @returns {TransformResult} the result of the rotation.
    */
   rotateRight() {
      return this.transform(0, 0, 1);
   }

   /**
    * Rotate the piece left.
    *
    * There is no need to call any other methods to animate this transformation.
    *
    * @returns {TransformResult} the result of the rotation.
    */
   rotateLeft() {
      return this.transform(0, 0, -1);
   }
}

/**
 * Basic element animations.
 */
class BaseAnimation {
   /**
    * Creates a BaseAnimation instance.
    *
    * @param {Board} board the board to use for output.
    * @param {PieceController} piece the controlled piece.
    * @param {DoneCallback} doneCallback called when the animation finishes.
    */
   constructor(board, piece, doneCallback) {
      /** @type {Board} */
      this.board = board;
      /** @type {PieceController} */
      this.piece = piece;
      /** @type {DoneCallback} */
      this.doneCallback = doneCallback;
      /** @type {EventHandler} */
      this.eventHandler = null;
   }

   /**
    * Initialize this animation.
    */
   initialize() {
      this.eventHandler = new EventHandler({ name: 'BaseAnimation' });
   }

   /**
    * Overload this method to add additional initialization to the animation start.
    */
   _initializeAnimation() {}

   /**
    * Starts the animation.
    *
    * @param {EventDispatch} dispatch to register to.
    */
   startAnimation(dispatch) {
      this.eventHandler.registerDispatch(dispatch);
      this._initializeAnimation();
      log(2, this, 'start ' + this.eventHandler?.name + ' animation', dispatch);
   }

   /**
    * Overload this method to add additional finalization steps to the animation.
    */
   _finalizeAnimation() {}

   /**
    * Stops the animation.
    */
   stopAnimation() {
      log(2, this, 'stop ' + this.eventHandler?.name + ' animation');
      this._finalizeAnimation();
      this.eventHandler.unregisterDispatch();
   }

   /**
    * Overload this method to add additional steps for when the animation finishes.
    */
   _done() {}

   /**
    * Executes the `doneCallback`.
    */
   done() {
      log(2, this, 'animation ' + this.eventHandler?.name + ' done');
      this._done();
      this.doneCallback();
   }
}

/**
 * Implements automatic screensaver animations.
 */
class Autoplay extends BaseAnimation {
   /**
    * Initialize Autoplay.
    */
   initialize() {
      this.eventHandler = new EventHandler({
         name: 'Autoplay',
         timed: this.handleAnimationEvent,
         mouse: this.handleExitEvent,
         key: this.handleExitEvent,
      });
      /** @type {TimedCallback} */
      this.next = null;
   }

   /**
    * Initialize autoplay animation.
    */
   _initializeAnimation() {
      this.eventHandler.retime(1000);
      this.next = this.nextMovePiece;
   }

   /**
    * Move the currently controlled piece down.
    *
    * @returns {boolean} if the event was handled here.
    */
   nextMovePiece() {
      const next = this.nextEnsureFreeSpace;
      if (!this.piece.piece) {
         this.next = next;
         return this.next();
      }
      const result = this.piece.moveDown();
      if (result.success) {
         return true;
      }
      this.nextFalling = true;
      this.next = next;
      this.piece.uncontrol();
      if (this.board.removeFullRows()) {
         return true;
      }
      return this.next();
   }

   /**
    * Ensures that there is enough space to insert a new piece.
    *
    * How much space this step creates is defined in `AUTOPLAYHEIGHT`.
    *
    * @returns {boolean} if the event was handled here.
    */
   nextEnsureFreeSpace() {
      const next = this.nextInsertPiece;
      if (this.board.getMaxHeight() < AUTOPLAYHEIGHT) {
         this.next = next;
         return this.next();
      }
      if (this.nextFalling && this.board.fallDown()) {
         this.nextFalling = false;
         return true;
      }
      this.nextFalling = true;
      if (this.board.removeFullRows()) {
         return true;
      }
      if (this.board.shiftDown()) {
         return true;
      }
      return true;
   }

   /**
    * Inserts a new piece.
    *
    * @returns {boolean} if the event was handled here.
    */
   nextInsertPiece() {
      const next = this.nextMovePiece;
      if (this.board.removeFullRows()) {
         return true;
      }
      const lowY = this.board.findLowColumn();
      const result = this.piece.insertRandom(lowY);
      if (result.success) {
         this.next = next;
         return true;
      }
      if (this.board.shiftDown()) {
         return true;
      }
      return true;
   }

   /**
    * Animate the autoplay.
    *
    * @returns {boolean} if the event was handled here.
    */
   handleAnimationEvent = () => {
      log(5, this, 'animation event');
      return this.next();
   };

   /**
    * Handle autoplay exit.
    *
    * @returns {boolean} if the event was handled here.
    */
   handleExitEvent = (event) => {
      log(2, this, 'exit event', event);
      this.done();
      return true;
   };
}

/**
 * Implements interactive gameplay.
 */
class Game extends BaseAnimation {
   /**
    * Initialize the game.
    */
   initialize() {
      this.eventHandler = new EventHandler({
         name: 'Game',
         timed: this.handleAnimationEvent,
         key: this.handleControlEvent,
      });
      /** @type {TimedCallback} */
      this.next = null;
   }

   /**
    * Initialize game animation.
    */
   _initializeAnimation() {
      this.eventHandler.retime(1000);
      this.next = this.nextMovePiece;
   }

   /**
    * Move the currently controlled piece down.
    *
    * @returns {boolean} if the event was handled here.
    */
   nextMovePiece() {
      const next = this.nextInsertPiece;
      if (!this.piece.piece) {
         this.next = next;
         return this.next();
      }
      const result = this.piece.moveDown();
      if (result.success) {
         return true;
      }
      this.next = next;
      this.piece.uncontrol();
      return this.next();
   }

   /**
    * Inserts a new piece.
    *
    * @returns {boolean} if the event was handled here.
    */
   nextInsertPiece() {
      const next = this.nextMovePiece;
      if (this.board.removeFullRows()) {
         return true;
      }
      const result = this.piece.insertRandom();
      if (result.success) {
         this.next = next;
         return true;
      }
      this.done();
      return true;
   }

   /**
    * Animate the game.
    *
    * @returns {boolean} if the event was handled here.
    */
   handleAnimationEvent = () => {
      log(5, this, 'animation event');
      return this.next();
   };

   /**
    * Handle game interaction.
    *
    * @param {KeyboardEvent} event
    * @returns {boolean} if the event was handled here.
    */
   handleControlEvent = (event) => {
      if (!this.piece.piece) return false;
      log(5, this, 'control event', event);
      switch (event.code) {
         case 'ArrowRight':
         case 'KeyD':
            this.piece.moveRight();
            return true;
         case 'ArrowLeft':
         case 'KeyA':
            this.piece.moveLeft();
            return true;
         case 'ArrowDown':
         case 'KeyS':
            this.piece.moveDown();
            return true;
         case 'ArrowUp':
         case 'KeyW':
         case 'KeyE':
            this.piece.rotateRight();
            return true;
         case 'KeyQ':
            this.piece.rotateLeft();
            return true;
         case 'Escape':
            this.done();
            return true;
      }
      return false;
   };
}

/**
 * Handles page content and events at the top level.
 */
class Page {
   /**
    * Creates a page instance.
    */
   constructor() {
      log(2, this, 'Starting self-test...');
      MoreMath._test();
      log(2, this, 'self-test completed.');
      this.board = new Board(10, 20);
      this.piece = new PieceController(this.board);
      this.dispatch = new EventDispatch();
      this.startHandler = new EventHandler({
         name: 'PageStarter',
         mouse: this.handleStartEvent,
         key: this.handleStartEvent,
      });
      this.controlHandler = new EventHandler({
         name: 'PageController',
         key: this.handleKeyEvent,
      });
      this.pageMode = true;
      this.autoplay = new Autoplay(this.board, this.piece, this.handleModeToggle);
      this.game = new Game(this.board, this.piece, this.handleModeToggle);
   }

   /**
    * Initialise the page.
    */
   initialize() {
      this.autoplay.initialize();
      this.game.initialize();
      const html_style = document.createElement('style');
      PIECES.forEach((piece) => {
         html_style.innerText += `.${piece.cls}{color:${piece.fg};background-color:${piece.bg};}`;
      });
      document.head.appendChild(html_style);
      this.dispatch.start();
      this.startHandler.registerDispatch(this.dispatch);
   }

   /**
    * Starts the page's actions.
    */
   start() {
      log(1, this, 'page start');
      this.startHandler.unregisterDispatch();
      this.controlHandler.registerDispatch(this.dispatch);
      this.board.createHTMLElements();
      this.dispatchModeUpdate();
   }

   /**
    * Stops the page's actions.
    */
   stop() {
      this.game.stopAnimation();
      this.autoplay.stopAnimation();
      this.controlHandler.unregisterDispatch();
      this.startHandler.registerDispatch(this.dispatch);
      log(1, this, 'page stop');
   }

   /**
    * Handle a mode update.
    */
   dispatchModeUpdate() {
      if (this.pageMode) {
         this.game.stopAnimation();
         this.autoplay.startAnimation(this.dispatch);
      } else {
         this.autoplay.stopAnimation();
         this.game.startAnimation(this.dispatch);
      }
   }

   /**
    * Handles a page start event.
    *
    * @returns {boolean} if the event was handled here.
    */
   handleStartEvent = () => {
      this.start();
      return true;
   };

   /**
    * Handle a keyboard event.
    *
    * @param {KeyboardEvent} event
    * @returns {boolean} if the event was handled here.
    */
   handleKeyEvent = (event) => {
      switch (event.key) {
         case '-':
            if (this.dispatch.timeoutInterval >= 100) {
               this.dispatch.timeoutInterval += 100;
               log(1, this, 'speed lowered. current interval: ' + this.dispatch.timeoutInterval);
            } else if (this.dispatch.timeoutInterval >= 20) {
               this.dispatch.timeoutInterval += 10;
               log(1, this, 'speed lowered. current interval: ' + this.dispatch.timeoutInterval);
            } else {
               this.dispatch.timeoutInterval = 20;
               log(1, this, 'speed lowered. current interval: ' + this.dispatch.timeoutInterval);
            }
            return true;
         case '+':
            if (this.dispatch.timeoutInterval >= 200) {
               this.dispatch.timeoutInterval -= 100;
               log(1, this, 'speed increased. current interval: ' + this.dispatch.timeoutInterval);
            } else if (this.dispatch.timeoutInterval >= 30) {
               this.dispatch.timeoutInterval -= 10;
               log(1, this, 'speed increased. current interval: ' + this.dispatch.timeoutInterval);
            } else {
               this.dispatch.timeoutInterval = 10;
               log(1, this, 'speed at maximum. current interval: ' + this.dispatch.timeoutInterval);
            }
            return true;
      }
      if (!event.altKey) return false;
      log(3, this, 'page config', event);
      if (!event.shiftKey)
         switch (event.code) {
            case 'KeyF':
               log(1, this, 'fall down: ' + this.board.fallDown());
               return true;
            case 'KeyD':
               log(1, this, 'shift down: ' + this.board.shiftDown());
               return true;
            case 'KeyR':
               log(1, this, 'remove full rows: ' + this.board.removeFullRows());
               return true;
            case 'KeyU':
            case 'KeyW':
               if (this.piece.piece) {
                  log(1, this, 'move piece up', this.piece.moveUp());
               } else {
                  log(1, this, 'cannot move piece up: No piece is currently being controlled.');
               }
               return true;
            case 'KeyI':
            case 'KeyJ':
            case 'KeyL':
            case 'KeyO':
            case 'KeyS':
            case 'KeyT':
            case 'KeyZ':
               const pieceName = event.code.charAt(3);
               const piece = PIECES.find((piece) => piece.name === pieceName);
               if (piece) {
                  log(1, this, 'next piece will be ' + pieceName, piece);
                  this.piece.nextPiece = piece;
               } else {
                  log(1, this, 'could not find piece ' + pieceName);
               }
               return true;
            case 'KeyC':
            case 'KeyQ':
               log(1, this, 'reset all');
               this.piece.uncontrol();
               this.board.clear();
               return true;
         }
      else
         switch (event.code) {
            case 'KeyD':
               log(1, this, 'drop/uncontrol piece');
               this.piece.uncontrol();
               return true;
            case 'KeyK':
               log(1, this, 'kill/restart event dispatch');
               this.dispatch.stop().start();
               return true;
            case 'KeyS':
               log(1, this, 'stop event dispatch');
               this.dispatch.stop();
               return true;
            case 'KeyC':
               log(1, this, 'continue event dispatch');
               this.dispatch.start();
               return true;
            case 'KeyP':
               log(1, this, 'pause timed dispatch');
               this.dispatch.stopTimed();
               return true;
            case 'KeyR':
               log(1, this, 'resume/restart timed dispatch');
               this.dispatch.retime();
               return true;
            case 'KeyM':
               log(1, this, 'toggle mode');
               this.handleModeToggle();
               return true;
         }
      return false;
   };

   /**
    * Handles a page mode toggle event.
    *
    * @returns {boolean} if the event was handled here.
    */
   handleModeToggle = () => {
      this.pageMode = !this.pageMode;
      this.dispatchModeUpdate();
      return true;
   };
}
