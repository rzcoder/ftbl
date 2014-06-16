var Game = require('./game');
var EventEmitter = require('./eventEmitter');

module.exports = (function() {

    function ServerGame(manager) {
        var _this = this;
        this.id = null;
        this.teams = [];
        this.game = new Game();
        this.gamesManager = manager;

        _this.setStatus('waiting');

        this.game.setListener('gameover', function () {
            _this.setStatus('finished');
        });
    }

    ServerGame.prototype = new EventEmitter();

    ServerGame.prototype.addPlayer = function (socket) {
        this.teams.push(socket);

        if (this.isComplete() && ~~(Math.random() * 1000 % 2) == 1) {
            this.teams.push(this.teams.shift());
            this.status = 'going';
        }

        return true;
    };

    ServerGame.prototype.isComplete = function () {
        return !!this.teams[0] && !!this.teams[1];
    };

    ServerGame.prototype.playerGone = function (socket) {
        var res = {};

        if (this.status == 'going') {
            if (this.teams[0] == socket) {
                res.socket = this.teams[1];
            } else {
                res.socket = this.teams[0];
            }
        }

        this.game.gameover('playerdc');

        this.gamesManager.gc(this);
        return res;
    };

    ServerGame.prototype.setStatus = function (status) {
        this.status = status;
        this.fireEvent('status', [status]);
    };

    return ServerGame;
})();