var Map = require('./map');

module.exports = (function() {

    function Game() {

    }

    Game.prototype.init = function(fieldSize) {
        this.map = new Map(fieldSize);
    };


    return Game;
})();