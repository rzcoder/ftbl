var styles = require('../styles');
var EventEmitter = require('../../../eventEmitter');

module.exports = (function () {
    var utils;

    var RESOURCES = {
        grass: 'assets/grass.jpg'
    };

    function Render(view) {
        var _this = this;

        this.view = view;
        this.ready = false;

        this.loadResources(function () {
            _this.ready = true;
            _this.fireEvent('ready');
        });

        this.setListener('ready', function () {
            _this.drawField();
        });
    }

    Render.prototype = new EventEmitter();

    Render.prototype.init = function (game) {
        this.game = game;
        utils = require('./renderUtils')(this.view.canvasParams, styles, this.game.map);

        // main context
        this.ctx = this.view.canvasParams.canvasEl.getContext('2d');

        // field background, borders, points
        this.fieldCanvas = this.newCanvas();
        this.fieldCtx = this.fieldCanvas.getContext('2d');

        // players moves
        this.movesCanvas = this.newCanvas();
        this.movesCtx = this.movesCanvas.getContext('2d');

        if (this.ready) {
            this.fireEvent('ready');
        }
    };

    /**
     * Create new dynamic canvas el
     *
     * @param width
     * @param height
     * @param id
     * @returns {HTMLElement}
     */
    Render.prototype.newCanvas = function (width, height, id) {
        var canvas = document.createElement('canvas');
        canvas.width = width || this.view.canvasParams.width;
        canvas.height = height || this.view.canvasParams.height;

        if (id) {
            canvas.id = id;
        }

        return canvas;
    };

    Render.prototype.loadResources = function (callback) {
        var calls = 0;
        for (var i in RESOURCES) {
            calls++;
            var img = new Image();
            img.src = RESOURCES[i];
            RESOURCES[i] = img;

            img.onload = function () {
                if (--calls == 0) {
                    callback();
                }
            };
        }
    };

    Render.prototype.render = function (ball) {
        this.ctx.drawImage(this.fieldCanvas, 0, 0);
        this.ctx.drawImage(this.movesCanvas, 0, 0);
        if (ball !== false) {
            this.drawBall(this.game.state.currentPosition.x, this.game.state.currentPosition.y);
        }
    };

    Render.prototype.preview = function (pos) {
        this.render(false);
        if (this.game.checkMovePossible(pos.x, pos.y)) {
            this.drawMovePreview(this.game.state.currentPosition.x, this.game.state.currentPosition.y, pos.x, pos.y);
        }

        this.drawBall(this.game.state.currentPosition.x, this.game.state.currentPosition.y);
    };

    Render.prototype.drawField = function () {
        // Draw background
        this.fieldCtx.fillStyle = this.fieldCtx.createPattern(RESOURCES.grass, 'repeat');
        this.fieldCtx.fillRect(0, 0, this.view.canvasParams.width, this.view.canvasParams.height);

        // Draw move points
        for (var y = 0; y < this.game.map.fieldSize; y++) {
            for (var x = 0; x < this.game.map.fieldSize; x++) {
                var pointSize;
                switch (this.game.map.field[y][x]) {
                    case 1:
                        this.fieldCtx.fillStyle = styles.borderPoint.color;
                        pointSize = styles.borderPoint.size;
                        break;
                    case 2:
                        this.fieldCtx.fillStyle = styles.fieldPoint.color;
                        pointSize = styles.fieldPoint.size;
                        break;
                    default:
                        continue;
                }

                utils.point(
                    this.fieldCtx,
                        this.view.canvasParams.padding + this.view.canvasParams.stepSize * x,
                        this.view.canvasParams.padding + this.view.canvasParams.stepSize * y,
                    pointSize
                );
            }
        }

        // Draw borders
        this.fieldCtx.strokeStyle = styles.border.color;
        this.fieldCtx.lineWidth = styles.border.size;
        this.fieldCtx.lineJoin = styles.border.lineJoin;
        this.fieldCtx.lineCap = styles.border.lineCap;

        this.fieldCtx.beginPath();
        for (var i = 0; i < this.game.map.borders.length; i++) {
            var pointX = this.game.map.borders[i][0];
            var pointY = this.game.map.borders[i][1];
            if (i == 0) {
                this.fieldCtx.moveTo(
                        this.view.canvasParams.padding + this.view.canvasParams.stepSize * pointX,
                        this.view.canvasParams.padding + this.view.canvasParams.stepSize * pointY
                );
            } else {
                this.fieldCtx.lineTo(
                        this.view.canvasParams.padding + this.view.canvasParams.stepSize * pointX,
                        this.view.canvasParams.padding + this.view.canvasParams.stepSize * pointY
                );
            }
        }
        this.fieldCtx.stroke();

        // Draw team captions
        utils.cornerCaption(this.fieldCtx, 'top-right', styles.team[0].color, 'Team 1');
        utils.cornerCaption(this.fieldCtx, 'bottom-left', styles.team[1].color, 'Team 2');

        if (this.view.client.player.team === 0) {
            utils.cornerCaption(this.fieldCtx, 'top-left', styles.team[0].color, 'Your team');
        } else {
            utils.cornerCaption(this.fieldCtx, 'bottom-right', styles.team[1].color, 'Your team');
        }
    };

    Render.prototype.drawMoves = function () {
        this.movesCtx.clearRect(0, 0, this.view.canvasParams.width, this.view.canvasParams.height);
        this.movesCtx.lineWidth = styles.move.size;
        this.movesCtx.lineJoin = styles.move.lineJoin;
        this.movesCtx.lineCap = styles.move.lineCap;

        for (var i in this.game.state.moveLog) {
            var move = this.game.state.moveLog[i];
            this.movesCtx.strokeStyle = styles.team[move.team].moveColor;
            this.movesCtx.beginPath();
            this.movesCtx.moveTo(
                    this.view.canvasParams.padding + this.view.canvasParams.stepSize * move.x,
                    this.view.canvasParams.padding + this.view.canvasParams.stepSize * move.y
            );
            this.movesCtx.lineTo(
                    this.view.canvasParams.padding + this.view.canvasParams.stepSize * move.mx,
                    this.view.canvasParams.padding + this.view.canvasParams.stepSize * move.my
            );
            this.movesCtx.stroke();
        }
    };

    Render.prototype.drawBall = function (x, y) {
        this.ctx.fillStyle = styles.team[this.game.state.currentPlayer].ballFillColor;
        this.ctx.strokeStyle = styles.team[this.game.state.currentPlayer].ballStrokeColor;
        this.ctx.lineWidth = styles.ball.lineWidth;

        utils.point(this.ctx,
                this.view.canvasParams.stepSize * x + this.view.canvasParams.padding,
                this.view.canvasParams.stepSize * y + this.view.canvasParams.padding,
                styles.ball.size / 2
        );
        utils.round(this.ctx,
                this.view.canvasParams.stepSize * x + this.view.canvasParams.padding,
                this.view.canvasParams.stepSize * y + this.view.canvasParams.padding,
                styles.ball.size / 2
        );
    };

    Render.prototype.drawMovePreview = function (x, y, mx, my) {
        this.ctx.strokeStyle = styles.team[this.view.client.player.team].moveColor;
        this.ctx.lineWidth = styles.move.size;
        this.ctx.lineJoin = styles.move.lineJoin;
        this.ctx.lineCap = styles.move.lineCap;

        this.ctx.beginPath();
        this.ctx.moveTo(
                x * this.view.canvasParams.stepSize + this.view.canvasParams.padding,
                y * this.view.canvasParams.stepSize + this.view.canvasParams.padding
        );
        this.ctx.lineTo(
                mx * this.view.canvasParams.stepSize + this.view.canvasParams.padding,
                my * this.view.canvasParams.stepSize + this.view.canvasParams.padding
        );

        this.ctx.stroke();
    };


    return Render;
})();