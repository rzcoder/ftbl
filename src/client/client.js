var Game = require('../game');
var GameView = require('./views/gameView');
var menuView = require('./views/menuView');
var Network = require('./network');

(function () {
    function Client() {
        this.network = new Network(this);
        this.network.connect();
        this.player = {
            team: 0
        };

        this.network.setListener('welcome', function (data) {
            console.log('welcome', data);
        });

        this.network.setListener('err', function (data) {
            console.error('error', data);
        });

        this.network.setListener('gameJoinStatus', function (data) {
            if (data.status == 'await') {
                this.menuView.showAwait(data);
            } else if (data.status == 'ready') {
                this.initGame(data.game);
                this.showGame();
            }
        });

        this.network.setListener('gameStatus', function (data) {
            this.player.team = data.team;
        });

        this.network.setListener('enemyGone', function (data) {
            this.game.gameover('playerdc');
        });

        this.network.setListener('move', function (data) {
            this.game.move(data);
        });

    }

    Client.prototype.init = function () {
        this.menuView = this.menuView || new menuView(this);

        if (window.location.hash) {
            this.network.joinPrivateGame(window.location.hash.slice(1));
        } else {
            this.menuView.init();
        }
    };

    Client.prototype.initGame = function (gameData) {
        this.game = new Game();
        this.game.init(gameData.fieldSize, gameData.state);

        if (!this.gameView) {
            this.gameView = new GameView(this);
            this.gameView.setListener('ready', function () {
                _this.gameView.render();
            });
        } else {
            this.gameView.init();
        }

        var _this = this;
    };

    Client.prototype.showMenu = function () {
        this.gameView.hide();
        this.menuView.showButtons();
        this.menuView.show();
    };

    Client.prototype.showGame = function () {
        this.menuView.hide();
        this.gameView.show();
    };

    window.onload = function () {
        var client = new Client();
        client.init();
    };
})();