var Render = require('./render');

module.exports = (function () {
    var CANVAS_SIZE = 520;
    var CANVAS_PADDING = 10;

    function View(client, callbacks, canvasSize, onReady) {
        var _this = this;
        this.client = client;
        this.game = client.game;
        this.callbacks = callbacks || {};

        this.canvasSize = canvasSize || CANVAS_SIZE;
        this.canvasParams = {
            canvasEl: document.querySelector('.gameview #canvas'),
            width: this.canvasSize,
            height: this.canvasSize,
            padding: CANVAS_PADDING,
            stepSize: ~~((this.canvasSize - CANVAS_PADDING * 2)  / (this.game.map.fieldSize - 1))
        };

        this.renderer = new Render(this, this.game, onReady);
        this.game.setListener('move', function() {
            _this.renderer.drawMoves();
            _this.renderer.render();
        });

        this.container = document.querySelector('.gameview');
        this.teamsScores = [
            document.querySelector('.gameview .scores-team1'),
            document.querySelector('.gameview .scores-team2')
        ];

        this.setEvents();

        this.game.setListener('goal', function(){ _this.updateScores(); });
    }

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
        this.teamsScores[0].innerText = this.game.state.scores[0];
        this.teamsScores[1].innerText = this.game.state.scores[1];
    };

    View.prototype.eventMouseMove = function (e) {
        var pos = this.calcMovePosition(e);
        if (this.game.state.currentPlayer == this.client.player.team) {
            this.renderer.preview(pos);
        }
        if(this.callbacks.mouseMove) this.callbacks.mouseMove(pos);
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

        if (this.callbacks.click) this.callbacks.click(pos);
    };

    return View;
})();