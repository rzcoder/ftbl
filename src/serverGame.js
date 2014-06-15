var Game = require('./game');

module.exports = (function() {

    function ServerGame() {
        this.id = null;
        this.teams = [];
        this.game = new Game();
    }

    ServerGame.prototype.addPlayer = function (socket) {
        this.teams.push(socket);

        if (this.isComplete() && ~~(Math.random() * 2 % 2 == 1)) {
            this.teams.push(this.teams.shift());
        }

        return true;
    };


    ServerGame.prototype.isComplete = function () {
        return !!this.teams[0] && !!this.teams[1];
    };

    return ServerGame;
})();