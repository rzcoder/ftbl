(function () {
    var canvas, ctx, gameState, teamsEl;

    var resources = {
        grass: new Image(),
        ball: new Image()
    };

    var canvasParams = {
        width: 520,
        height: 520,
        margin: 10,
        stepSize: 50
    };

    var borders = [
        [0, 1],
        [3, 1],
        [3, 0],
        [7, 0],
        [7, 1],
        [10, 1],
        [10, 9],
        [7, 9],
        [7, 10],
        [3, 10],
        [3, 9],
        [0, 9],
        [0, 1],
        [0, 5],
        [10, 5]
    ];

    var fieldSize = 11;

    var field = [
        [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
        [1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1],
        [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0]
    ];

    var styles = {
        border: {
            size: 3,
            color: 'rgba(255, 255, 255, 1)'
        },

        borderPoint: {
            size: 3,
            color: 'rgba(255, 255, 255, 1)'
        },

        fieldPoint: {
            size: 3,
            color: 'rgba(175, 175, 175, 1)',
            lineCap: 'round',
            lineJoin: 'round'
        },

        ball: {
            lineWidth: 2,
            size: 16
        },

        move: {
            size: 4,
            lineCap: 'round',
            lineJoin: 'round'
        },

        caption: {
            background: 'rgba(255, 255, 255, 0.6)',
            font: "25px Audiowide, 'Helvetica Neue', cursive"
        },

        team: [{
            color: 'rgba(235, 50, 15, .9)',
            ballFillColor: 'rgba(235, 50, 15, 0.45)',
            ballStrokeColor: 'rgba(235, 50, 15, 0.8)'
        },{
            color: 'rgba(11, 76, 185, .9)',
            ballFillColor: 'rgba(45, 70, 235, 0.45)',
            ballStrokeColor: 'rgba(45, 70, 235, 0.8)'
        }]
    };

    function init() {
        var container = document.querySelector('.container');
        canvas = document.querySelector('canvas');
        ctx = canvas.getContext('2d');

        teamsEl = [
            document.querySelector('.scores-team1'),
            document.querySelector('.scores-team2')
        ];

        gameState = {
            playerTeam: 1,
            team1Score: 0,
            team2Score: 0,
            currentPlayer: 0,
            moveLog: [],
            currentPosition: {
                x: 5,
                y: 5
            },
            field: field.slice(0)
        };


        // TEST
        gameState.moveLog = [
            {team: 1, x:5, y:5, mx:6, my:6},
            {team: 0, x:6, y:6, mx:5, my:6},
            {team: 1, x:5, y:6, mx:4, my:7},
            {team: 1, x:4, y:7, mx:5, my:8},
            {team: 0, x:5, y:5, mx:4, my:6},
            {team: 0, x:4, y:6, mx:3, my:7},
            {team: 1, x:3, y:7, mx:4, my:8}
        ];
        gameState.currentPosition = {
            x: 3,
            y: 1
        };

        loadResources(function() {
            drawMap();
            startEvents();
            container.className = container.className.replace('hidden', '');
        });

        drawScores();
    }

    function drawMap() {
        drawField();
        drawBall(gameState.currentPosition.x, gameState.currentPosition.y);
        drawMoves();
    }

    function drawMoves() {
        ctx.lineWidth = styles.move.size;
        ctx.lineJoin = styles.move.lineJoin;
        ctx.lineCap = styles.move.lineCap;

        for(var i in gameState.moveLog) {
            var move = gameState.moveLog[i];
            ctx.strokeStyle = styles.team[move.team].color;
            ctx.beginPath();
            ctx.moveTo(canvasParams.margin + canvasParams.stepSize * move.x, canvasParams.margin +  canvasParams.stepSize * move.y);
            ctx.lineTo(canvasParams.margin + canvasParams.stepSize * move.mx, canvasParams.margin +  canvasParams.stepSize * move.my);
            ctx.stroke();
        }
    }

    /**
     * Return array of possible moves from x,y
     * @param x
     * @param y
     * @returns {Array}
     */
    function getPossibleMoves(x, y) {
        var res = [];

        for(var xi = -1; xi <= 1; xi++) {
            for(var yi = -1; yi <= 1; yi++) {
                if (checkMovePossible(x, y, x + xi, y + yi)) {
                    res.push({x: x + xi, y: y + yi});
                }
            }
        }

        return res;
    }

    /**
     * Check if move from x,y to mx,my possible
     * @param x
     * @param y
     * @param mx
     * @param my
     * @returns {boolean}
     */
    function checkMovePossible(x, y, mx, my) {
        if ((x == mx && y == my) && mx < 0 || my < 0 || mx > fieldSize || mx > fieldSize || field[my][mx] == 0 ||
           (field[y][x] == 1 && field[my][mx] == 1 && (y == my || x == mx) )
        ) {
           return false;
        }

        for(var i in gameState.moveLog) {
            var move = gameState.moveLog[i];
            if ((mx == move.mx && my == move.my && x == move.x  && y == move.y) ||
                (mx == move.x  && my == move.y  && x == move.mx && y == move.my)) {
                return false;
            }
        }

        return true;
    }

    function calcMovePosition (e) {
        e = e || window.event;

        var target = e.target || e.srcElement,
            rect = target.getBoundingClientRect(),
            offsetX = e.clientX - rect.left,
            offsetY = e.clientY - rect.top;

        var res = {
            x: offsetX - canvasParams.margin,
            y: offsetY - canvasParams.margin
        };

        var halfStep = canvasParams.stepSize / 2;
        var posX = gameState.currentPosition.x * canvasParams.stepSize;
        var posY = gameState.currentPosition.y * canvasParams.stepSize;

        if (res.x > posX + halfStep) {
            res.x = gameState.currentPosition.x + 1;
        } else if (res.x < posX - halfStep) {
            res.x = gameState.currentPosition.x - 1;
        } else {
            res.x = gameState.currentPosition.x;
        }

        if (res.y > posY + halfStep) {
            res.y = gameState.currentPosition.y + 1;
        } else if (res.y < posY - halfStep) {
            res.y = gameState.currentPosition.y - 1;
        } else {
            res.y = gameState.currentPosition.y;
        }

        return res;
    }


    function eventMouseMove(e) {
        drawField();

        var pos = calcMovePosition(e);
        drawMap();
        if(checkMovePossible(gameState.currentPosition.x, gameState.currentPosition.y, pos.x, pos.y)) {
            drawMove(gameState.currentPosition.x, gameState.currentPosition.y, pos.x, pos.y, 0);
        }
    }

    function eventClick(e) {
        var pos = calcMovePosition(e);
        console.log(pos.x, pos.y)
    }

    function startEvents() {
        canvas.removeEventListener('mousemove', eventMouseMove);
        canvas.removeEventListener('click', eventClick);

        canvas.addEventListener('mousemove', eventMouseMove);
        canvas.addEventListener('click', eventClick);
    }


    function loadResources(callback) {
        var calls = 1;
        resources.grass.src = '/assets/grass.jpg';

        resources.grass.onload = function() {
            if(--calls == 0) {callback();}
        };
    }

    function drawScores() {
        teamsEl[0].innerText = '0' + gameState.team1Score;
        teamsEl[1].innerText = '0' + gameState.team1Score;
    }

    var drawingUtils = {
        point: function (ctx, x, y, radius) {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
            ctx.fill();
        },

        round: function (ctx, x, y, radius) {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
            ctx.stroke();
        },

        teamCaption: function(ctx, corner, style, text) {
            var posX, posY;

            switch (corner){
                case 'top-left':
                    posX = canvasParams.margin;
                    posY = canvasParams.margin;
                    break;
                case 'top-right':
                    posX = canvasParams.stepSize * 7 + canvasParams.margin * 2;
                    posY = canvasParams.margin;
                    break;
                case 'bottom-left':
                    posX = canvasParams.margin;
                    posY = canvasParams.stepSize * 9 + canvasParams.margin * 2;
                    break;
                case 'bottom-right':
                default:
                    posX = canvasParams.stepSize * 7 + canvasParams.margin * 2;
                    posY = canvasParams.stepSize * 9 + canvasParams.margin * 2;
            }


            ctx.fillStyle = styles.caption.background;
            ctx.fillRect(posX, posY, canvasParams.stepSize * 3 - canvasParams.margin, canvasParams.stepSize - canvasParams.margin);

            ctx.font = styles.caption.font;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = style;

            ctx.fillText(text, posX + canvasParams.stepSize * 1.5 - canvasParams.margin/2, posY + canvasParams.stepSize * 0.5 - canvasParams.margin/2);
        }

    };

    function drawBall(x, y) {
        ctx.fillStyle = styles.team[gameState.currentPlayer].ballFillColor;
        ctx.strokeStyle = styles.team[gameState.currentPlayer].ballStrokeColor;
        ctx.lineWidth = styles.ball.lineWidth;

        drawingUtils.point(ctx,
                canvasParams.stepSize * x + canvasParams.margin,
                canvasParams.stepSize * y + canvasParams.margin,
                styles.ball.size / 2);
        drawingUtils.round(ctx,
                canvasParams.stepSize * x + canvasParams.margin,
                canvasParams.stepSize * y + canvasParams.margin,
                styles.ball.size / 2);
    }

    function drawField() {
        ctx.fillStyle = ctx.createPattern(resources.grass, 'repeat');
        ctx.fillRect(0, 0, canvasParams.width, canvasParams.height);

        for (var y = 0; y < fieldSize; y++) {
            for(var x = 0; x < fieldSize; x++) {
                var pointSize;
                switch(field[y][x]) {
                    case 1:
                        ctx.fillStyle = styles.borderPoint.color;
                        pointSize = styles.borderPoint.size;
                        break;
                    case 2:
                        ctx.fillStyle = styles.fieldPoint.color;
                        pointSize = styles.fieldPoint.size;
                        break;
                    default:
                        continue;
                }

                drawingUtils.point(ctx, canvasParams.margin + canvasParams.stepSize * x, canvasParams.margin + canvasParams.stepSize * y, pointSize);
            }
        }

        ctx.strokeStyle = styles.border.color;
        ctx.lineWidth = styles.border.size;
        ctx.lineJoin = styles.border.lineJoin;
        ctx.lineCap = styles.border.lineCap;

        ctx.beginPath();
        for(var i = 0; i < borders.length; i++) {
            var pointX = borders[i][0];
            var pointY = borders[i][1];
            if(i == 0) {
                ctx.moveTo(canvasParams.margin + canvasParams.stepSize * pointX, canvasParams.margin +  canvasParams.stepSize * pointY);
            } else {
                ctx.lineTo(canvasParams.margin + canvasParams.stepSize * pointX, canvasParams.margin +  canvasParams.stepSize * pointY);
            }
        }
        ctx.stroke();

        drawingUtils.teamCaption(ctx, 'top-right', styles.team[0].color, 'Team 1');
        drawingUtils.teamCaption(ctx, 'bottom-left', styles.team[1].color, 'Team 2');

        if (gameState.playerTeam === 0) {
            drawingUtils.teamCaption(ctx, 'top-left', styles.team[0].color, 'You team');
        } else {
            drawingUtils.teamCaption(ctx, 'bottom-right', styles.team[1].color, 'You team');
        }
    }

    function drawMove(startX, startY, moveX, moveY, team) {
        ctx.strokeStyle = styles.team[team].color;
        ctx.lineWidth = styles.move.size;
        ctx.lineJoin = styles.move.lineJoin;
        ctx.lineCap = styles.move.lineCap;
        ctx.beginPath();
        ctx.moveTo(canvasParams.margin + canvasParams.stepSize * startX, canvasParams.margin +  canvasParams.stepSize * startY);
        ctx.lineTo(canvasParams.margin + canvasParams.stepSize * moveX, canvasParams.margin +  canvasParams.stepSize * moveY);
        ctx.stroke();
    }

    window.onload = init;
})();