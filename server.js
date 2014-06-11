Game = require('./src/game');

game = new Game();
game.init();


for(var i =0; i < game.map.field.length; i++) {
    console.log.apply(console, game.map.field[i]);
}

console.log(game.map.borders);

/*var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var config = {
    port: 3000,
    staticFolder: __dirname + '/static'
};

app.use(express.static(config.staticFolder));

server.listen(config.port, function() {
    console.log('Listening on port ' + config.port);
});       */