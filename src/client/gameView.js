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
            _this.log('gameover');
        });
    }

    View.prototype = new EventEmitter();

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
                addRecord('gameover', 'Game over! <br/>' + scores() + '<br/>' + winTeam);
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