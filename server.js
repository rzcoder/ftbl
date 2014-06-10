var express = require('express');
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
});