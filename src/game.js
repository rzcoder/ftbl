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