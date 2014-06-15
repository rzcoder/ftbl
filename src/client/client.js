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

        this.gameView = this.gameView || new GameView(this, null, null, function(){
            _this.gameView.render();
            _this.gameView.show();
        });

        var _this = this;

    };

    window.onload = function() {
        var client = new Client();
        client.init();
    };
})();