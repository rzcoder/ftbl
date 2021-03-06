var config = require('./src/config');
var GamesManager = require('./src/gamesManager');

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static(__dirname + '/static'));

var games = new GamesManager();

io.on('connection', function (socket) {
    function errorReport(msg, e) {
        try {
            console.error(msg, e);
            socket.emit('err', {message: msg + ' ' + e});
        } catch (e) {
            console.error('Error report', e);
        }
    }

    function onGameReady(game) {
        try {
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
        } catch (e) {
            errorReport('Init game', e);
        }
    }

    function disconnect() {
        try {
            if (socket.data.game) {
                var res = socket.data.game.playerGone(socket);

                if (res.socket) {
                    res.socket.emit('enemyGone');
                    res.socket.data = {}
                }
            }

            socket.data = {};
        } catch (e) {
            errorReport('Leave game', e);
        }
    }

    try {
        socket.data = socket.data || {};
        socket.emit('welcome', socket.data);
    } catch (e) {
        errorReport('Init', e);
    }

    socket.on('joinOpen', function (data) {
        try {
            if (socket.data.gameId) {
                socket.emit('err', {message: 'Already in game'});
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
        } catch (e) {
            errorReport('Join open game', e);
        }
    });

    socket.on('joinPrivate', function (data) {
        try {
            if (socket.data.gameId) {
                socket.emit('err', {message: 'Already in game'});
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
        } catch (e) {
            errorReport('Join private game', e);
        }
    });

    socket.on('disconnect', function () {
        disconnect();
    });

    socket.on('leaveGame', function () {
        disconnect();
    });

    socket.on('move', function (data) {
        try {
            if (!socket.data.game) {
                socket.emit('err', {message: 'You not in game'});
                return;
            }

            var serverGame = socket.data.game;

            if (serverGame.game.state.currentPlayer == socket.data.team && serverGame.game.state.currentPlayer == data.team) {
                if (serverGame.game.move(data)) {
                    serverGame.teams[0].emit('move', data);
                    serverGame.teams[1].emit('move', data);
                } else {
                    socket.emit('err', {message: 'Impossible move'});
                }
            } else {
                socket.emit('err', {message: 'Not you move'});
            }
        } catch (e) {
            errorReport('Move', e);
        }
    });
});

server.listen(config.port, function () {
    console.log('Listening on port ' + config.port);
});