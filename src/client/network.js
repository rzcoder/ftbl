module.exports = (function() {

    function Network(client) {
        this.client = client;
    }

    Network.prototype.connect = function() {
        this.socket = io.connect('/');
    };

    Network.prototype.setListener = function(event, cb) {
        var client =  this.client;
        this.socket.on(event, function(){ cb.apply(client, arguments); })
    };

    Network.prototype.joinOpenGame = function() {
        this.socket.emit('joinOpen');
    };

    Network.prototype.joinPrivateGame = function(id) {
        this.socket.emit('joinPrivate', {id: id});
    };

    Network.prototype.move = function(pos) {
        this.socket.emit('move', pos);
    };

    return Network;
})();
