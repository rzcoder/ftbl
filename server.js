var config = require('./src/config');
var GameManager = require('./src/gameManager');


var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static(__dirname + '/static'));

var games = new GameManager();

io.on('connection', function (socket) {
    socket.data = socket.data || {};
    socket.emit('welcome', socket.data);

    function onGameReady(game) {
        game.game.init();

        var status = {
            status: 'ready',
            game: {
                id: game.id,
                fieldSize: game.game.map.fieldSize,
                state: game.game.state
            }
        };

        game.teams[0].data.team = 0;
        game.teams[0].emit('gameJoinStatus', status);
        game.teams[0].emit('gameStatus', {team: 0});

        game.teams[1].data.team = 1;
        game.teams[1].emit('gameJoinStatus', status);
        game.teams[1].emit('gameStatus', {team: 1});
    }

    socket.on('joinOpen', function (data) {
        if (socket.data.gameId) {
            return;
        }

        var game = games.joinOpenGame(socket,
            function (game) {
                socket.emit('gameJoinStatus', {status: 'await'});
            },
            onGameReady
        );

        socket.data.gameId = game.id;
        socket.data.game = game;
    });

    socket.on('joinPrivate', function (data) {
        if (socket.data.gameId) {
            return;
        }

        var game = games.joinPrivateGame(socket, data.id,
            function (game) {
                socket.emit('gameJoinStatus', {
                    status: 'await',
                    game: {
                        id: game.id
                    }
                });
            },
            onGameReady
        );

        socket.data.gameId = game.id;
        socket.data.game = game;
    });

    socket.on('move', function (data) {
        var serverGame = socket.data.game;

        if (serverGame.game.state.currentPlayer == socket.data.team && serverGame.game.state.currentPlayer == data.team) {
            if(serverGame.game.move(data)) {
                serverGame.teams[0].emit('move', data);
                serverGame.teams[1].emit('move', data);
            } else {
                socket.emit('err', {message: 'Impossible move'});
            }
        } else {
            socket.emit('err', {message: 'Not you move'});
        }
    });
});

server.listen(config.port, function() {
    console.log('Listening on port ' + config.port);
});