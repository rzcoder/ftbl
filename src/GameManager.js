var ServerGame = require('./serverGame');
var utils = require('./utils');

module.exports = (function() {

    function GameManager() {
        this.games = {};
        this.waitingOpenGames = [];
        this.waitingPrivateGames = {};
    }


    GameManager.prototype.getGame = function (id) {
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
    GameManager.prototype.joinOpenGame = function (socket, waitCb, completeCb) {
        var game;
        if (this.waitingOpenGames.length > 0) {
            game = this.waitingOpenGames.shift();
            game.addPlayer(socket);
            this.games[game.id] = game;
        } else {
            game = new ServerGame();
            game.id = utils.makeid(15);
            game.addPlayer(socket);
            this.waitingOpenGames.push(game);
        }

        setTimeout(function() {
            if (game.isComplete()) {
                completeCb(game);
            } else {
                waitCb(game);
            }
        }, 0);

        return game;
    };

    GameManager.prototype.joinPrivateGame = function (socket, id, waitCb, completeCb) {
        var game;
        if (id && (game = this.waitingPrivateGames[id])) {
            game.addPlayer(socket);
            this.games[game.id] = game;
            delete this.waitingPrivateGames[id];
        } else {
            game = new ServerGame();
            game.id = utils.makeid(6);
            game.addPlayer(socket);
            this.waitingPrivateGames[game.id] = game;
        }

        setTimeout(function() {
            if (game.isComplete()) {
                completeCb(game);
            } else {
                waitCb(game);
            }
        }, 0);

        return game;
    };


    return GameManager;
})();