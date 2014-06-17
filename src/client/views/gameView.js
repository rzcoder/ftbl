var Render = require('./render/render');
var View = require('./view');

module.exports = (function () {
    var CANVAS_SIZE = 520;
    var CANVAS_PADDING = 10;

    function GameView(client, canvasSize) {
        var _this = this;

        this.client = client;
        this.renderer = new Render(this);

        this.canvasSize = canvasSize || CANVAS_SIZE;

        this.container = document.querySelector('.gameview');
        this.teamsScores = [
            document.querySelector('.gameview .scores-team-0'),
            document.querySelector('.gameview .scores-team-1')
        ];
        this.movesLog = document.querySelector('.gameview .moves-log');
        this.controls = {
            container: document.querySelector('.gameview .control-buttons'),
            returnBtn: document.querySelector('.gameview .control-buttons [data-role="toMain"]')
        };

        this.renderer.setListener('ready', function () {
            _this.fireEvent('ready');
        });

        this.init();
        this.setEvents();
    }

    GameView.prototype = new View();

    GameView.prototype.init = function () {
        var _this = this;

        this.network = this.client.network;
        this.game = this.client.game;

        this.canvasParams = {
            canvasEl: document.querySelector('.gameview #canvas'),
            width: this.canvasSize,
            height: this.canvasSize,
            padding: CANVAS_PADDING,
            stepSize: ~~((this.canvasSize - CANVAS_PADDING * 2) / (this.game.map.fieldSize - 1))
        };

        this.renderer.init(this.game);

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

        this.game.setListener('gameover', function (reason) {
            _this.show(_this.controls.container);
            _this.log('gameover', reason);
        });

        this.hide(this.controls.container);
        this.movesLog.innerHTML = '';
        this.updateScores();
    };


    GameView.prototype.render = function () {
        this.renderer.render();
        this.updateScores();
    };

    GameView.prototype.setEvents = function () {
        var _this = this;

        this.canvasParams.canvasEl.addEventListener('mousemove', function () {
            _this.eventMouseMove.apply(_this, arguments);
        });
        this.canvasParams.canvasEl.addEventListener('click', function () {
            _this.eventClick.apply(_this, arguments);
        });

        this.controls.returnBtn.addEventListener('click', function () {
            _this.network.leaveGame();
            _this.client.showMenu();
        });
    };

    GameView.prototype.calcMovePosition = function (e) {
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

    GameView.prototype.updateScores = function () {
        this.teamsScores[0].innerHTML = '0' + this.game.state.scores[0];
        this.teamsScores[1].innerHTML = '0' + this.game.state.scores[1];
    };

    GameView.prototype.log = function (type) {
        var _this = this;

        if (this.game.state.finished) {
            return;
        }

        function addRecord(type, html) {
            _this.movesLog.innerHTML = '<span class="log-message log-' + type + '">' + html + '</span>' + (_this.movesLog.innerHTML || '');
        }

        function team(team) {
            return '<span class="team-inline-' + team + ' style-team-' + team + '"> Team ' + (team + 1) + '</span>';
        }

        function scores() {
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
                var winTeam, gameover;

                if (this.game.state.scores[0] == this.game.state.scores[1]) {
                    winTeam = '<span></span>'
                } else {
                    winTeam = (this.game.state.scores[0] > this.game.state.scores[1] ? team(0) : team(1)) + ' win!';
                }

                if (arguments[1] == 'playerdc') {
                    gameover = 'Your opponent disconnected.';
                } else {
                    gameover = 'Game over!';
                }
                addRecord('gameover', gameover + scores() + '<br/>');
                addRecord('gameover', winTeam);
                break;
        }

    };

    GameView.prototype.eventMouseMove = function (e) {
        var pos = this.calcMovePosition(e);
        if (this.game.state.currentPlayer == this.client.player.team) {
            this.renderer.preview(pos);
        }
        this.fireEvent('mousemove', [pos]);
    };

    GameView.prototype.eventClick = function (e) {
        if (this.game.state.finished) {
            return;
        }

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

    return GameView;
})();