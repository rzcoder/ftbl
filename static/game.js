(function () {
    var canvas, ctx, gameState, teamsEl;

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
            color: 'rgba(255, 255, 255, 0.8)'
        },
        borderPoint: {
            size: 3,
            color: 'rgba(255, 255, 255, 1)'
        },

        fieldPoint: {
            size: 3,
            color: 'rgba(155, 155, 155, 1)'
        }
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
            field: field.slice(0)
        };


        loadResources(function() {
            drawField();
        });

        drawScores();
    }

    function loadResources(callback) {
        grassImg = new Image();
        grassImg.src = '/assets/grass.jpg';
        grassImg.onload = function() {
            //callback();
        }
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
        }
    };

    function drawField() {
        ctx.fillStyle = ctx.createPattern(grassImg, 'repeat');
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
        ctx.lineWidth =  styles.border.size;

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
    }

    window.onload = init;
})();