(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Game = require('../game');
var GameView = require('./gameView');
var StartView = require('./startView');
var Network = require('./network');

(function() {


    function Client () {
        this.network = new Network(this);
        this.network.connect();
        this.player = {
            team: 0
        };

        this.network.setListener('welcome', function(data) {
            console.log(data);
        });

        this.network.setListener('err', function(data) {
            console.log(data);
        });

        this.network.setListener('gameJoinStatus', function(data) {
            if (data.status == 'await') {
                this.startView.showAwait(data);
            } else if (data.status == 'ready') {
                console.log(data);
                this.startView.hide();
                this.initGame(data.game);
                this.gameView.show();
            }
        });

        this.network.setListener('gameStatus', function(data) {
            this.player.team = data.team;
        });

        this.network.setListener('enemyGone', function(data) {
            this.game.gameover('playerdc');
        });

        this.network.setListener('move', function(data) {
            this.game.move(data);
        });

    }

    Client.prototype.init = function() {
        this.startView = this.startView || new StartView(this);

        if (window.location.hash) {
            this.network.joinPrivateGame(window.location.hash.slice(1));
        } else {
            this.startView.init();
        }
    };

    Client.prototype.initGame = function(gameData) {
        this.game = new Game();
        this.game.init(gameData.fieldSize, gameData.state);

        if (! this.gameView) {
            this.gameView = new GameView(this, null);
            this.gameView.setListener('ready', function() {
                _this.gameView.render();
                _this.gameView.show();
            });
        } else {
            this.gameView.init();
        }

        var _this = this;

    };

    window.onload = function() {
        var client = new Client();
        client.init();
    };
})();
},{"../game":10,"./gameView":2,"./network":3,"./startView":6}],2:[function(require,module,exports){
var Render = require('./render');
var EventEmitter = require('../eventEmitter');

module.exports = (function () {
    var CANVAS_SIZE = 520;
    var CANVAS_PADDING = 10;

    View.prototype = new EventEmitter();

    function View(client, canvasSize) {
        var _this = this;
        this.client = client;
        this.game = client.game;

        this.canvasSize = canvasSize || CANVAS_SIZE;
        this.canvasParams = {
            canvasEl: document.querySelector('.gameview #canvas'),
            width: this.canvasSize,
            height: this.canvasSize,
            padding: CANVAS_PADDING,
            stepSize: ~~((this.canvasSize - CANVAS_PADDING * 2)  / (this.game.map.fieldSize - 1))
        };

        this.renderer = new Render(this, this.game);

        this.container = document.querySelector('.gameview');
        this.teamsScores = [
            document.querySelector('.gameview .scores-team-0'),
            document.querySelector('.gameview .scores-team-1')
        ];
        this.movesLog = document.querySelector('.gameview .moves-log');
        this.controls = document.querySelector('.gameview .control-buttons');

        this.setEvents();

        this.renderer.setListener('ready', function () {
            _this.fireEvent('ready');
        });

        this.game.setListener('move', function (move, newTeam) {
            _this.renderer.drawMoves();
            _this.renderer.render();
            _this.log('move', move, newTeam);
        });

        this.game.setListener('goal', function (team) {
            _this.updateScores();
            _this.renderer.render();
            _this.log('goal', team);
        });

        this.game.setListener('deadend', function (team) {
            _this.updateScores();
            _this.renderer.render();
            _this.log('deadend', team);
        });

        this.game.setListener('gameover', function () {
            _this.show(_this.controls);
            _this.log('gameover');
        });
    }

    View.prototype = new EventEmitter();

    View.prototype.init = function (){
        this.hide(this.controls);
        this.movesLog.innerHTML = '';
        this.updateScores();
    };


    View.prototype.render = function() {
        this.renderer.render();
        this.updateScores();
    };

    View.prototype.show = function(el) {
        var el = el || this.container;
        el.className = el.className.replace('hidden', '');
    };

    View.prototype.hide = function(el) {
        var el = el || this.container;
        el.className = el.className.replace('hidden', '') + ' hidden';
    };

    View.prototype.setEvents = function() {
        var _this = this;

        this.canvasParams.canvasEl.addEventListener('mousemove', function(){ _this.eventMouseMove.apply(_this, arguments);});
        this.canvasParams.canvasEl.addEventListener('click', function(){ _this.eventClick.apply(_this, arguments);});
    };

    View.prototype.calcMovePosition = function(e) {
        var e = e || window.event;
        var state = this.game.state;

        var target = e.target || e.srcElement,
            rect = target.getBoundingClientRect(),
            offsetX = e.clientX - rect.left,
            offsetY = e.clientY - rect.top;

        var res = {
            x: offsetX - this.canvasParams.padding,
            y: offsetY - this.canvasParams.padding
        };

        var halfStep = this.canvasParams.stepSize / 2;
        var posX = state.currentPosition.x * this.canvasParams.stepSize;
        var posY = state.currentPosition.y * this.canvasParams.stepSize;

        if (res.x > posX + halfStep) {
            res.x = state.currentPosition.x + 1;
        } else if (res.x < posX - halfStep) {
            res.x = state.currentPosition.x - 1;
        } else {
            res.x = state.currentPosition.x;
        }

        if (res.y > posY + halfStep) {
            res.y = state.currentPosition.y + 1;
        } else if (res.y < posY - halfStep) {
            res.y = state.currentPosition.y - 1;
        } else {
            res.y = state.currentPosition.y;
        }

        return res;
    };

    View.prototype.updateScores = function () {
        this.teamsScores[0].innerHTML = '0' + this.game.state.scores[0];
        this.teamsScores[1].innerHTML = '0' + this.game.state.scores[1];
    };

    View.prototype.log = function (type) {
        var _this = this;

        function addRecord (type, html) {
            _this.movesLog.innerHTML = '<span class="log-message log-' + type + '">' + html + '</span>' + (_this.movesLog.innerHTML || '');
        }

        function team (team) {
            return '<span class="team-inline-' + team + ' style-team-' + team + '"> Team ' + (team + 1) + '</span>';
        }

        function scores () {
            return '<span class="style-team-0 score-inline">0' + _this.game.state.scores[0] + '</span>' +
            '<span class="score-inline-delimiter">:</span>' +
            '<span class="style-team-1 score-inline">0' + _this.game.state.scores[1] + '</span>';
        }

        switch (type) {
            case 'move':
                addRecord('move', team(arguments[1].team) +
                    ' moves to ' + arguments[1].mx + ':' + arguments[1].my +
                    (arguments[1].team == arguments[2] ? ' and continue!' : '. Turn passes to ' + team(arguments[2]))
                );
                break;

            case 'goal':
                addRecord('goal', 'GOAL! ' + team(arguments[1]) + ' scores! ' + scores());
                addRecord('move', team(arguments[1] ^ 1) + ' moves.');
                break;

            case 'deadend':
                addRecord('deadend', team(arguments[1]) + ' in the dead end! ' + scores());
                addRecord('move', team(arguments[1]) + ' moves again.');
                break;
                break;

            case 'gameover':
                if(this.game.state.scores[0] == this.game.state.scores[1]) {
                    var winTeam = '<span></span>'
                } else {
                    var winTeam = (this.game.state.scores[0] > this.game.state.scores[1] ? team(0) : team(1)) + ' win!';
                }
                addRecord('gameover', 'Game over! ' + scores() + '<br/>');
                addRecord('gameover', winTeam);
                break;
        }

    };

    View.prototype.eventMouseMove = function (e) {
        var pos = this.calcMovePosition(e);
        if (this.game.state.currentPlayer == this.client.player.team) {
            this.renderer.preview(pos);
        }
        this.fireEvent('mousemove', [pos]);
    };

    View.prototype.eventClick = function (e) {
        var pos = this.calcMovePosition(e);

        if (this.game.state.currentPlayer == this.client.player.team) {
            this.client.network.move({
                x: this.game.state.currentPosition.x,
                y: this.game.state.currentPosition.y,
                mx: pos.x,
                my: pos.y,
                team: this.client.player.team
            });
        }

        this.fireEvent('click', [pos]);
    };

    return View;
})();
},{"../eventEmitter":9,"./render":4}],3:[function(require,module,exports){
var config = require('../config');

module.exports = (function() {

    function Network(client) {
        this.client = client;
    }

    Network.prototype.connect = function() {
        this.socket = io(':3000');
    };

    Network.prototype.setListener = function(event, cb) {
        var client =  this.client;
        this.socket.on(event, function(){ cb.apply(client, arguments); })
    };

    Network.prototype.joinOpenGame = function() {
        this.socket.emit('joinOpen');
    };

    Network.prototype.joinPrivateGame = function(id) {
        this.socket.emit('joinPrivate', {id: id});
    };

    Network.prototype.move = function(pos) {
        this.socket.emit('move', pos);
    };

    return Network;
})();

},{"../config":8}],4:[function(require,module,exports){
var styles = require('./styles');
var EventEmitter = require('../eventEmitter');

module.exports = (function () {
    var utils;

    var RESOURCES = {
        grass: 'assets/grass.jpg'
    };

    function Render(view, game) {
        this.game = game;
        this.view = view;
        utils = require('./renderUtils')(this.view.canvasParams, styles, this.game.map);

        // main context
        this.ctx = this.view.canvasParams.canvasEl.getContext('2d');

        // field background, borders, points
        this.fieldCanvas = this.newCanvas();
        this.fieldCtx = this.fieldCanvas.getContext('2d');

        // players moves
        this.movesCanvas = this.newCanvas();
        this.movesCtx = this.movesCanvas.getContext('2d');

        var _this = this;
        this.loadResources(function () {
            _this.drawField();
            _this.fireEvent('ready');
        });
    }

    Render.prototype = new EventEmitter();

    /**
     * Create new dynamic canvas el
     *
     * @param width
     * @param height
     * @param id
     * @returns {HTMLElement}
     */
    Render.prototype.newCanvas = function (width, height, id) {
        var canvas = document.createElement('canvas');
        canvas.width = width || this.view.canvasParams.width;
        canvas.height = height || this.view.canvasParams.height;

        if (id) {
            canvas.id = id;
        }

        return canvas;
    };

    Render.prototype.loadResources = function (callback) {
        var calls = 0;
        for (var i in RESOURCES) {
            calls++;
            var img = new Image();
            img.src = RESOURCES[i];
            RESOURCES[i] = img;

            img.onload = function () {
                if (--calls == 0) {
                    callback();
                }
            };
        }
    };

    Render.prototype.render = function (ball) {
        this.ctx.drawImage(this.fieldCanvas, 0, 0);
        this.ctx.drawImage(this.movesCanvas, 0, 0);
        if (ball !== false) {
            this.drawBall(this.game.state.currentPosition.x, this.game.state.currentPosition.y);
        }
    };

    Render.prototype.preview = function (pos) {
        this.render(false);
        if (this.game.checkMovePossible(pos.x, pos.y)) {
            this.drawMovePreview(this.game.state.currentPosition.x, this.game.state.currentPosition.y, pos.x, pos.y);
        }

        this.drawBall(this.game.state.currentPosition.x, this.game.state.currentPosition.y);
    };

    Render.prototype.drawField = function () {
        // Draw background
        this.fieldCtx.fillStyle = this.fieldCtx.createPattern(RESOURCES.grass, 'repeat');
        this.fieldCtx.fillRect(0, 0, this.view.canvasParams.width, this.view.canvasParams.height);

        // Draw move points
        for (var y = 0; y < this.game.map.fieldSize; y++) {
            for (var x = 0; x < this.game.map.fieldSize; x++) {
                var pointSize;
                switch (this.game.map.field[y][x]) {
                    case 1:
                        this.fieldCtx.fillStyle = styles.borderPoint.color;
                        pointSize = styles.borderPoint.size;
                        break;
                    case 2:
                        this.fieldCtx.fillStyle = styles.fieldPoint.color;
                        pointSize = styles.fieldPoint.size;
                        break;
                    default:
                        continue;
                }

                utils.point(
                    this.fieldCtx,
                        this.view.canvasParams.padding + this.view.canvasParams.stepSize * x,
                        this.view.canvasParams.padding + this.view.canvasParams.stepSize * y,
                    pointSize
                );
            }
        }

        // Draw borders
        this.fieldCtx.strokeStyle = styles.border.color;
        this.fieldCtx.lineWidth = styles.border.size;
        this.fieldCtx.lineJoin = styles.border.lineJoin;
        this.fieldCtx.lineCap = styles.border.lineCap;

        this.fieldCtx.beginPath();
        for (var i = 0; i < this.game.map.borders.length; i++) {
            var pointX = this.game.map.borders[i][0];
            var pointY = this.game.map.borders[i][1];
            if (i == 0) {
                this.fieldCtx.moveTo(
                        this.view.canvasParams.padding + this.view.canvasParams.stepSize * pointX,
                        this.view.canvasParams.padding + this.view.canvasParams.stepSize * pointY
                );
            } else {
                this.fieldCtx.lineTo(
                        this.view.canvasParams.padding + this.view.canvasParams.stepSize * pointX,
                        this.view.canvasParams.padding + this.view.canvasParams.stepSize * pointY
                );
            }
        }
        this.fieldCtx.stroke();

        // Draw team captions
        utils.cornerCaption(this.fieldCtx, 'top-right', styles.team[0].color, 'Team 1');
        utils.cornerCaption(this.fieldCtx, 'bottom-left', styles.team[1].color, 'Team 2');

        if (this.view.client.player.team === 0) {
            utils.cornerCaption(this.fieldCtx, 'top-left', styles.team[0].color, 'You team');
        } else {
            utils.cornerCaption(this.fieldCtx, 'bottom-right', styles.team[1].color, 'You team');
        }
    };

    Render.prototype.drawMoves = function () {
        this.movesCtx.clearRect(0, 0, this.view.canvasParams.width, this.view.canvasParams.height);
        this.movesCtx.lineWidth = styles.move.size;
        this.movesCtx.lineJoin = styles.move.lineJoin;
        this.movesCtx.lineCap = styles.move.lineCap;

        for (var i in this.game.state.moveLog) {
            var move = this.game.state.moveLog[i];
            this.movesCtx.strokeStyle = styles.team[move.team].moveColor;
            this.movesCtx.beginPath();
            this.movesCtx.moveTo(
                    this.view.canvasParams.padding + this.view.canvasParams.stepSize * move.x,
                    this.view.canvasParams.padding + this.view.canvasParams.stepSize * move.y
            );
            this.movesCtx.lineTo(
                    this.view.canvasParams.padding + this.view.canvasParams.stepSize * move.mx,
                    this.view.canvasParams.padding + this.view.canvasParams.stepSize * move.my
            );
            this.movesCtx.stroke();
        }
    };

    Render.prototype.drawBall = function (x, y) {
        this.ctx.fillStyle = styles.team[this.game.state.currentPlayer].ballFillColor;
        this.ctx.strokeStyle = styles.team[this.game.state.currentPlayer].ballStrokeColor;
        this.ctx.lineWidth = styles.ball.lineWidth;

        utils.point(this.ctx,
                this.view.canvasParams.stepSize * x + this.view.canvasParams.padding,
                this.view.canvasParams.stepSize * y + this.view.canvasParams.padding,
                styles.ball.size / 2
        );
        utils.round(this.ctx,
                this.view.canvasParams.stepSize * x + this.view.canvasParams.padding,
                this.view.canvasParams.stepSize * y + this.view.canvasParams.padding,
                styles.ball.size / 2
        );
    };

    Render.prototype.drawMovePreview = function (x, y, mx, my) {
        this.ctx.strokeStyle = styles.team[this.view.client.player.team].moveColor;
        this.ctx.lineWidth = styles.move.size;
        this.ctx.lineJoin = styles.move.lineJoin;
        this.ctx.lineCap = styles.move.lineCap;

        this.ctx.beginPath();
        this.ctx.moveTo(
                x * this.view.canvasParams.stepSize + this.view.canvasParams.padding,
                y * this.view.canvasParams.stepSize + this.view.canvasParams.padding
        );
        this.ctx.lineTo(
                mx * this.view.canvasParams.stepSize + this.view.canvasParams.padding,
                my * this.view.canvasParams.stepSize + this.view.canvasParams.padding
        );

        this.ctx.stroke();
    };


    return Render;
})();
},{"../eventEmitter":9,"./renderUtils":5,"./styles":7}],5:[function(require,module,exports){
module.exports = function(canvasParams, styles, map) {
    exports = {};

    exports.point = function (ctx, x, y, radius) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
        ctx.fill();
    };

    exports.round = function (ctx, x, y, radius) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
        ctx.stroke();
    };

    exports.cornerCaption = function (ctx, corner, fillStyle, text) {
        var posX, posY;

        switch (corner) {
            case 'top-left':
                posX = canvasParams.padding;
                posY = canvasParams.padding;
                break;
            case 'top-right':
                posX = canvasParams.stepSize * (map.fieldSize - map.gateSize) + canvasParams.padding * 2;
                posY = canvasParams.padding;
                break;
            case 'bottom-left':
                posX = canvasParams.padding;
                posY = canvasParams.stepSize * (map.fieldSize - 2) + canvasParams.padding * 2;
                break;
            case 'bottom-right':
            default:
                posX = canvasParams.stepSize * (map.fieldSize - map.gateSize) + canvasParams.padding * 2;
                posY = canvasParams.stepSize * (map.fieldSize - 2) + canvasParams.padding * 2;
        }


        ctx.fillStyle = styles.caption.background;
        ctx.fillRect(posX, posY, canvasParams.stepSize * 3 - canvasParams.padding, canvasParams.stepSize - canvasParams.padding);

        ctx.font = styles.caption.font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = fillStyle;

        ctx.fillText(text, posX + canvasParams.stepSize * 1.5 - canvasParams.padding / 2, posY + canvasParams.stepSize * 0.5 - canvasParams.padding / 2);
    };

    return exports;

};
},{}],6:[function(require,module,exports){
module.exports = (function () {

    function View(client) {
        this.client = client;
        this.network = client.network;

        this.container = document.querySelector('.startview');
        this.buttonsContainer = document.querySelector('.startview .buttons');
        this.buttons = {
            'open': document.querySelector('.startview button[data-role="open"]'),
            'new': document.querySelector('.startview button[data-role="new"]')
        };

        this.infoContainer = document.querySelector('.startview .info');
        this.infoText = document.querySelector('.startview .info .infoText');
        this.infoLink = document.querySelector('.startview .info .infoLink');
        this.setEvents();
    }

    View.prototype.init = function (){
        this.show(this.buttonsContainer);
        this.hide(this.infoContainer);
    };

    View.prototype.show = function (el) {
        var el = el || this.container;
        el.className = el.className.replace('hidden', '');
    };

    View.prototype.hide = function (el) {
        var el = el || this.container;
        el.className = el.className.replace('hidden', '') + ' hidden';
    };

    View.prototype.setEvents = function () {
        var _this = this;
        this.buttons.open.addEventListener('click', function() { _this.network.joinOpenGame(); });
        this.buttons.new.addEventListener('click', function() { _this.network.joinPrivateGame(); });
        this.infoLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (document.body.createTextRange) {
                var range = document.body.createTextRange();
                range.moveToElementText(_this.infoLink);
                range.select();
            } else if (window.getSelection) {
                var selection = window.getSelection();
                var range = document.createRange();
                range.selectNodeContents(_this.infoLink);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });
    };

    View.prototype.showAwait = function (data) {
        this.hide(this.buttonsContainer);
        this.show(this.infoContainer);

        if(data.game) {
            var location = window.location;
            var url = location.protocol + '//' + location.host + location.pathname + '#' + data.game.id;

            this.infoText.innerHTML = 'Give the following link to your friend:';
            this.infoLink.innerHTML = url;
            this.infoLink.setAttribute('href', url);
        } else {
            this.infoText.innerHTML = 'Waiting for opponent...';
            this.infoLink.innerHTML = '';
            this.infoLink.setAttribute('src', '');
        }

    };

    return View;
})();
},{}],7:[function(require,module,exports){
module.exports = {
    border: {
        size: 3,
        color: 'rgba(255, 255, 255, 1)'
    },

    borderPoint: {
        size: 3,
        color: 'rgba(255, 255, 255, 1)'
    },

    fieldPoint: {
        size: 3,
        color: 'rgba(175, 175, 175, 1)',
        lineCap: 'round',
        lineJoin: 'round'
    },

    ball: {
        lineWidth: 2,
        size: 16
    },

    move: {
        size: 3,
        lineCap: 'round',
        lineJoin: 'round'
    },

    caption: {
        background: 'rgba(255, 255, 255, 0.6)',
        font: "25px Audiowide, Arial"
    },

    team: [
        {
            color: 'rgba(235, 50, 15, .9)',
            moveColor: 'rgba(231, 65, 65, .9)',
            ballFillColor: 'rgba(235, 50, 15, 0.45)',
            ballStrokeColor: 'rgba(235, 50, 15, 0.8)'
        },
        {
            color: 'rgba(11, 76, 185, .9)',
            moveColor: 'rgba(15, 15, 231, .9)',
            ballFillColor: 'rgba(45, 70, 235, 0.45)',
            ballStrokeColor: 'rgba(45, 70, 235, 0.8)'
        }
    ]
};
},{}],8:[function(require,module,exports){
module.exports = {
    port: 3000
}
},{}],9:[function(require,module,exports){
module.exports = (function () {
    function EventEmitter() {
        this.callbacks = [];
    }

    EventEmitter.prototype.setListener = function (event, fn) {
        this.callbacks[event] = this.callbacks[event] || [];
        this.callbacks[event].push(fn);
    };

    EventEmitter.prototype.fireEvent = function (event, args) {
        if (Array.isArray(this.callbacks[event])) {
            for (var i in this.callbacks[event]) {
                var fn = this.callbacks[event][i];
                fn.apply(this, args);
            }
        }
    };

    return EventEmitter;
})();

},{}],10:[function(require,module,exports){
var Map = require('./map');
var EventEmitter = require('./eventEmitter');
var utils = require('./utils');

module.exports = (function() {

    function Game() {

    }

    Game.prototype = new EventEmitter();

    Game.prototype.init = function(mapData, state, callbacks) {
        this.map = new Map();
        this.callbacks = callbacks  || {};

        if(typeof mapData == 'object') {
            this.map.load(mapData);
        } else {
            this.map.generate(mapData);
        }

        this.state = state || {
            scores: [0,0],
            currentPlayer: 0,
            moveLog: [],
            field: utils.clone2DArray(this.map.field),
            currentPosition: {
                x: ~~(this.map.fieldSize / 2),
                y: ~~(this.map.fieldSize / 2)
            }

        };
    };

    Game.prototype.toStartPosition = function() {
        this.state.currentPosition = {
            x: ~~(this.map.fieldSize / 2),
            y: ~~(this.map.fieldSize / 2)
        }
    };

    /**
     * Return array of possible moves from x,y
     * @param x
     * @param y
     * @returns {Array}
     */
    Game.prototype.getPossibleMoves = function(x, y) {
        if(x === undefined && y === undefined) {
            x = this.state.currentPosition.x;
            y = this.state.currentPosition.y;
        }

        var res = [];

        for(var xi = -1; xi <= 1; xi++) {
            for(var yi = -1; yi <= 1; yi++) {
                if (this.checkMovePossible(x, y, x + xi, y + yi)) {
                    res.push({x: x + xi, y: y + yi});
                }
            }
        }

        return res;
    };

    /**
     * Check if move from x,y to mx,my possible
     * @param x
     * @param y
     * @param mx
     * @param my
     * @returns {boolean}
     */
    Game.prototype.checkMovePossible = function(x, y, mx, my) {
        if (mx === undefined && my === undefined) {
            mx = x;
            my = y;
            x = this.state.currentPosition.x;
            y = this.state.currentPosition.y;
        }

        if ((x == mx && y == my) || // not same point
            mx < 0 || my < 0 || mx >= this.map.fieldSize || mx >= this.map.fieldSize || // not map overflow
            this.map.field[my][mx] == 0 || // not field overflow
            (this.map.field[y][x] == 1 && this.map.field[my][mx] == 1 && (y == my || x == mx)) || // not from border to border
            this.map.field[my][x] == 0) // not protruding corner
        {
            return false;
        }

        // not one of past moves
        for(var i in this.state.moveLog) {
            var move = this.state.moveLog[i];
            if ((mx == move.mx && my == move.my && x == move.x  && y == move.y) ||
                (mx == move.x  && my == move.y  && x == move.mx && y == move.my)) {
                return false;
            }
        }

        return true;
    };

    Game.prototype.move = function(move) {
        if (this.checkMovePossible(move.x, move.y, move.mx, move.my)) {

            this.state.moveLog.push(move);

            if (this.state.field[move.my][move.mx] == 2) {
                this.state.currentPlayer = this.state.currentPlayer ^ 1;
            }

            this.state.field[move.my][move.mx] = 3;


            this.state.currentPosition.x = move.mx;
            this.state.currentPosition.y = move.my;
            this.fireEvent('move', [move, this.state.currentPlayer]);

            if (move.my == 0 && move.mx >= 3 && move.mx <= 7) {
                this.goal(1);
            } else if (move.my == this.map.fieldSize - 1 && move.mx >= 3 && move.mx <= 7) {
                this.goal(0);
            } else if (this.getPossibleMoves(move.mx, move.my).length == 0) {
                this.goal(move.team ^ 1, true);
            }

            return true;
        } else {
            return false;
        }
    };

    Game.prototype.goal = function(team, deadend) {
        this.state.scores[team]++;
        this.state.currentPlayer = team ^ 1;

        this.toStartPosition();

        if (deadend) {
            this.fireEvent('deadend', [team ^ 1]);
        } else {
            this.fireEvent('goal', [team]);
        }

        if (this.getPossibleMoves().length == 0) {
            this.gameover('nomoves');
        }
    };

    Game.prototype.gameover = function(reason) {
        this.fireEvent('gameover', [reason]);
    };

    return Game;
})();
},{"./eventEmitter":9,"./map":11,"./utils":12}],11:[function(require,module,exports){
module.exports = (function() {
    var MAP_DEFAULT_SIZE = 11;
    var GATE_DEFAULT_SIZE = 4;

    function Map() {
        this.gateSize = GATE_DEFAULT_SIZE;

        if(this.fieldSize < 9 || this.fieldSize % 2 == 0) {
            throw new Error('Field size is too small or even.');
        }
    }

    Map.prototype.generate = function(fieldSize) {
        this.fieldSize = fieldSize || MAP_DEFAULT_SIZE;

        var half = ~~(this.fieldSize / 2);
        var gateXStart = ~~((this.fieldSize - this.gateSize) / 2);
        var gateXEnd = this.fieldSize - ~~((this.fieldSize - this.gateSize) / 2) - 1;

        this.field = new Array(this.fieldSize);

        for (var y = 0; y < this.fieldSize; y++) {
            this.field[y] = new Array(this.fieldSize);
            for (var x = 0; x < this.fieldSize; x++) {

                if (y == 0 || y == this.fieldSize - 1) {
                    // gates
                    if (x < gateXStart || x > gateXEnd) {
                        this.field[y][x] = 0;
                    } else {
                        this.field[y][x] = 1;
                    }
                } else if (y == 1 || y == this.fieldSize - 2) {
                    // middle line
                    if (x < gateXStart + 1 || x > gateXEnd - 1) {
                        this.field[y][x] = 1;
                    } else {
                        this.field[y][x] = 2;
                    }
                } else if (y == half) {
                    // gate lines
                    this.field[y][x] = 1;
                } else {
                    // left && right borders
                    if (x == 0 || x == this.fieldSize - 1) {
                        this.field[y][x] = 1;
                    } else {
                        this.field[y][x] = 2;
                    }
                }

            }
        }

        this.makeBorders();
    };

    Map.prototype.makeBorders = function() {
        var half = ~~(this.fieldSize / 2);
        var gateXStart = ~~((this.fieldSize - this.gateSize) / 2);
        var gateXEnd = this.fieldSize - ~~((this.fieldSize - this.gateSize) / 2) - 1;

        this.borders = [
            [0, 1],
            [gateXStart, 1],
            [gateXStart, 0],
            [gateXEnd, 0],
            [gateXEnd, 1],
            [this.fieldSize - 1, 1],
            [this.fieldSize - 1, this.fieldSize - 2],
            [gateXEnd, this.fieldSize - 2],
            [gateXEnd, this.fieldSize - 1],
            [gateXStart, this.fieldSize - 1],
            [gateXStart, this.fieldSize - 2],
            [0, this.fieldSize - 2],
            [0, 1],
            [0, half],
            [this.fieldSize - 1, half]
        ];
    };

    Map.prototype.load = function(mapData) {
        this.fieldSize = mapData.fieldSize;
        this.field = mapData.field;

        this.makeBorders();
    };

    return Map;
})();
},{}],12:[function(require,module,exports){
module.exports.makeid = function (length) {
    length = length || 5;
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        text += possible.charAt(~~(Math.random() * possible.length));

    return text;
};

module.exports.clone2DArray = function (array) {
    var res = [];
    for(var i = 0; i < array.length; i++) {
        res.push(array[i].slice(0));
    }

    return res;
};
},{}]},{},[1])