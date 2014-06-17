var ServerGame = require('./serverGame');
var utils = require('./utils');

module.exports = (function () {

    function GamesManager() {
        this.games = {};
        this.waitingOpenGames = {};
        this.waitingOpenGamesIds = [];
        this.waitingPrivateGames = {};

        this.$gcTimeout = null;
        this.gc();
    }


    GamesManager.prototype.getGame = function (id) {
        return this.games[id];
    };

    /**
     * Join or Create new open game
     *
     * @param socket
     * @param waitCb callback when game only created
     * @param completeCb callback when game complete
     * @returns {*}
     */
    GamesManager.prototype.joinOpenGame = function (socket, waitCb, completeCb) {
        var game;

        if (this.waitingOpenGamesIds.length > 0) {
            var id = this.waitingOpenGamesIds.shift();
            game = this.waitingOpenGames[id];
            game.addPlayer(socket);
            this.games[game.id] = game;
            delete this.waitingOpenGames[id];
        } else {
            game = new ServerGame(this);
            game.id = utils.makeid(15);
            game.addPlayer(socket);
            this.waitingOpenGames[game.id] = game;
            this.waitingOpenGamesIds.push(game.id);
        }

        setTimeout(function () {
            if (game.isComplete()) {
                completeCb(game);
            } else {
                waitCb(game);
            }
        }, 0);

        return game;
    };

    GamesManager.prototype.joinPrivateGame = function (socket, id, waitCb, completeCb) {
        var game;
        if (id && (game = this.waitingPrivateGames[id])) {
            game.addPlayer(socket);
            this.games[game.id] = game;
            delete this.waitingPrivateGames[id];
        } else {
            game = new ServerGame(this);
            game.id = utils.makeid(6);
            game.addPlayer(socket);
            this.waitingPrivateGames[game.id] = game;
        }

        setTimeout(function () {
            if (game.isComplete()) {
                completeCb(game);
            } else {
                waitCb(game);
            }
        }, 0);

        return game;
    };

    GamesManager.prototype.gc = function (game) {
        var _this = this;

        if (game) {
            if (game.status == 'finished') {
                if (this.waitingOpenGames[game.id]) {
                    delete this.waitingOpenGames[game.id];
                    var index = this.waitingOpenGamesIds.indexOf(game.id);
                    if (index > -1) {
                        this.waitingOpenGamesIds.splice(index, 1);
                    }
                } else if (this.waitingPrivateGames[game.id]) {
                    delete this.waitingPrivateGames[game.id];
                }
            }
        } else {
            clearTimeout(this.$gcTimeout);
            this.$gcTimeout = setTimeout(function () {
                _this.gc();
            }, 60 * 1000);

            var containers = [this.games, this.waitingOpenGames, this.waitingPrivateGames];
            for (var i in containers) {
                var games = containers[i];
                for (var id in games) {
                    var game = games[id];
                    if (game.status == 'finished' || game.teams.length == 0) {
                        for(var i in game.teams) {
                            game.teams[i].data = {}
                        }
                        delete games[id];
                    }
                }
            }

        }
    };


    return GamesManager;
})();