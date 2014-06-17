module.exports = function (canvasParams, styles, map) {
    exports = {};

    exports.point = function (ctx, x, y, radius) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
        ctx.fill();
    };

    exports.round = function (ctx, x, y, radius) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
        ctx.stroke();
    };

    exports.cornerCaption = function (ctx, corner, fillStyle, text) {
        var posX, posY;

        switch (corner) {
            case 'top-left':
                posX = canvasParams.padding;
                posY = canvasParams.padding;
                break;
            case 'top-right':
                posX = canvasParams.stepSize * (map.fieldSize - map.gateSize) + canvasParams.padding * 2;
                posY = canvasParams.padding;
                break;
            case 'bottom-left':
                posX = canvasParams.padding;
                posY = canvasParams.stepSize * (map.fieldSize - 2) + canvasParams.padding * 2;
                break;
            case 'bottom-right':
            default:
                posX = canvasParams.stepSize * (map.fieldSize - map.gateSize) + canvasParams.padding * 2;
                posY = canvasParams.stepSize * (map.fieldSize - 2) + canvasParams.padding * 2;
        }


        ctx.fillStyle = styles.caption.background;
        ctx.fillRect(posX, posY, canvasParams.stepSize * 3 - canvasParams.padding, canvasParams.stepSize - canvasParams.padding);

        ctx.font = styles.caption.font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = fillStyle;

        ctx.fillText(text, posX + canvasParams.stepSize * 1.5 - canvasParams.padding / 2, posY + canvasParams.stepSize * 0.5 - canvasParams.padding / 2);
    };

    return exports;

};