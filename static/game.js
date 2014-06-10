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
            size: 2,
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
            fillColor: 'rgba(230, 220, 173, 1)',
            strokeColor: 'rgba(0, 0, 0, 1)',
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
            font: "30px 'Audiowide' 'Helvetica Neue' cursive"
        },

        team: [{
            color: 'rgba(210, 0, 0, .9)'
        },{
            color: 'rgba(11, 76, 185, .9)'
        }]
    };

    function init() {
        canvas = document.querySelector('canvas');
        ctx = canvas.getContext('2d');

        teamsEl = [
            document.querySelector('.scores-team1'),
            document.querySelector('.scores-team2')
        ];

        gameState = {
            team1Score: 0,
            team2Score: 0,
            moveLog: [],
            currentPlayer: 0,
            currentPosition: {
                x: 5,
                y: 5
            },
            field: field.slice(0)
        };


        loadResources(function() {
            drawField();
            drawBall(gameState.currentPosition.x, gameState.currentPosition.y);
            startEvents();
        });

        drawScores();
    }

    function calcMovePosition (x, y) {
        var res = {
            x: x - canvasParams.margin,
            y: y - canvasParams.margin
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

        var pos = calcMovePosition(e.offsetX, e.offsetY);
        drawMove(gameState.currentPosition.x, gameState.currentPosition.y, pos.x, pos.y, 0);
        drawBall(gameState.currentPosition.x, gameState.currentPosition.y);
    }

    function eventClick(e) {
        var pos = calcMovePosition(e.offsetX, e.offsetY);
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
        point: function (ctx, x, y, radius){
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
            ctx.fill();
        },
        round: function (ctx, x, y, radius){
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
            ctx.stroke();
        }

    };

    function drawBall(x, y) {
        ctx.fillStyle = styles.ball.fillColor;
        ctx.strokeStyle = styles.ball.strokeColor;
        ctx.lineWidth = styles.ball.lineWidth;
        drawingUtils.point(ctx,
                canvasParams.stepSize * x + canvasParams.margin,
                canvasParams.stepSize * y + canvasParams.margin,
                styles.ball.size / 2);
        drawingUtils.round(ctx,
                canvasParams.stepSize * x + canvasParams.margin,
                canvasParams.stepSize * y + canvasParams.margin,
                styles.ball.size / 2);

        /*ctx.drawImage(resources.ball,
                canvasParams.stepSize * x - ~~(canvasParams.stepSize / 4) + canvasParams.margin,
                canvasParams.stepSize * y - ~~(canvasParams.stepSize / 4) + canvasParams.margin,
                styles.ball.size,
                styles.ball.size
        );*/
    }

    function drawField() {
        ctx.fillStyle = ctx.createPattern(resources.grass, 'repeat');
        ctx.fillRect(0, 0, canvasParams.width, canvasParams.height);

        for (var y = 0; y < field.length; y++) {
            for(var x = 0; x < field[y].length; x++) {
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

        ctx.fillStyle = styles.caption.background
        ctx.fillRect(canvasParams.stepSize * 7 + canvasParams.margin * 2, canvasParams.margin, canvasParams.stepSize * 3 - canvasParams.margin, canvasParams.stepSize - canvasParams.margin)
        ctx.fillRect(canvasParams.margin, canvasParams.stepSize * 9 + canvasParams.margin * 2, canvasParams.stepSize * 3 - canvasParams.margin, canvasParams.stepSize - canvasParams.margin)
        ctx.font = styles.caption.font;
        ctx.fillStyle = styles.team[0].color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText('Team 1', canvasParams.stepSize * 8.5 + canvasParams.margin * 2 - 5,  canvasParams.stepSize * 0.5 + canvasParams.margin - 5);
        ctx.fillStyle = styles.team[1].color;
        ctx.fillText('Team 2', canvasParams.stepSize * 1.5 + canvasParams.margin * 1 - 5,  canvasParams.stepSize * 9.5 + canvasParams.margin * 2 - 5);
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