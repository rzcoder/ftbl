var EventEmitter = require('../../eventEmitter');

module.exports = (function () {
    function View() {
    }

    View.prototype = new EventEmitter();

    View.prototype.show = function (el) {
        var el = el || this.container;
        el.className = el.className.replace('hidden', '');
    };

    View.prototype.hide = function (el) {
        var el = el || this.container;
        el.className = el.className.replace('hidden', '') + ' hidden';
    };

    return View;
})();