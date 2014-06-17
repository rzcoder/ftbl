module.exports = (function () {
    var MAP_DEFAULT_SIZE = 11;
    var GATE_DEFAULT_SIZE = 4;

    function Map() {
        this.gateSize = GATE_DEFAULT_SIZE;

        if (this.fieldSize < 9 || this.fieldSize % 2 == 0) {
            throw new Error('Field size is too small or even.');
        }
    }

    Map.prototype.generate = function (fieldSize) {
        this.fieldSize = fieldSize || MAP_DEFAULT_SIZE;

        var half = ~~(this.fieldSize / 2);
        var gateXStart = ~~((this.fieldSize - this.gateSize) / 2);
        var gateXEnd = this.fieldSize - ~~((this.fieldSize - this.gateSize) / 2) - 1;

        this.field = new Array(this.fieldSize);

        for (var y = 0; y < this.fieldSize; y++) {
            this.field[y] = new Array(this.fieldSize);
            for (var x = 0; x < this.fieldSize; x++) {

                if (y == 0 || y == this.fieldSize - 1) {
                    // gates
                    if (x < gateXStart || x > gateXEnd) {
                        this.field[y][x] = 0;
                    } else {
                        this.field[y][x] = 1;
                    }
                } else if (y == 1 || y == this.fieldSize - 2) {
                    // middle line
                    if (x < gateXStart + 1 || x > gateXEnd - 1) {
                        this.field[y][x] = 1;
                    } else {
                        this.field[y][x] = 2;
                    }
                } else if (y == half) {
                    // gate lines
                    this.field[y][x] = 1;
                } else {
                    // left && right borders
                    if (x == 0 || x == this.fieldSize - 1) {
                        this.field[y][x] = 1;
                    } else {
                        this.field[y][x] = 2;
                    }
                }

            }
        }

        this.makeBorders();
    };

    Map.prototype.makeBorders = function () {
        var half = ~~(this.fieldSize / 2);
        var gateXStart = ~~((this.fieldSize - this.gateSize) / 2);
        var gateXEnd = this.fieldSize - ~~((this.fieldSize - this.gateSize) / 2) - 1;

        this.borders = [
            [0, 1],
            [gateXStart, 1],
            [gateXStart, 0],
            [gateXEnd, 0],
            [gateXEnd, 1],
            [this.fieldSize - 1, 1],
            [this.fieldSize - 1, this.fieldSize - 2],
            [gateXEnd, this.fieldSize - 2],
            [gateXEnd, this.fieldSize - 1],
            [gateXStart, this.fieldSize - 1],
            [gateXStart, this.fieldSize - 2],
            [0, this.fieldSize - 2],
            [0, 1],
            [0, half],
            [this.fieldSize - 1, half]
        ];
    };

    Map.prototype.load = function (mapData) {
        this.fieldSize = mapData.fieldSize;
        this.field = mapData.field;

        this.makeBorders();
    };

    return Map;
})();