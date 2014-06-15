module.exports = (function () {
    function EventEmitter() {
        this.callbacks = [];
    }

    EventEmitter.prototype.setListener = function (event, fn) {
        this.callbacks[event] = this.callbacks[event] || [];
        this.callbacks[event].push(fn);
    };

    EventEmitter.prototype.fireEvent = function (event, args) {
        if (Array.isArray(this.callbacks[event])) {
            for (var i in this.callbacks[event]) {
                var fn = this.callbacks[event][i];
                fn.apply(this, args);
            }
        }
    };

    return EventEmitter;
})();
