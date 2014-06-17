var View = require('./view');

module.exports = (function () {
    function MenuView(client) {
        this.client = client;
        this.network = client.network;

        this.container = document.querySelector('.menuview');
        this.buttonsContainer = document.querySelector('.menuview .buttons');
        this.buttons = {
            'open': document.querySelector('.menuview button[data-role="open"]'),
            'new': document.querySelector('.menuview button[data-role="new"]')
        };

        this.infoContainer = document.querySelector('.menuview .info');
        this.infoText = document.querySelector('.menuview .info .infoText');
        this.infoLink = document.querySelector('.menuview .info .infoLink');
        this.setEvents();
    }

    MenuView.prototype = new View();

    MenuView.prototype.init = function (){
        this.show(this.buttonsContainer);
        this.hide(this.infoContainer);
    };

    MenuView.prototype.setEvents = function () {
        var _this = this;
        this.buttons.open.addEventListener('click', function() { _this.network.joinOpenGame(); });
        this.buttons.new.addEventListener('click', function() { _this.network.joinPrivateGame(); });
        this.infoLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (document.body.createTextRange) {
                var range = document.body.createTextRange();
                range.moveToElementText(_this.infoLink);
                range.select();
            } else if (window.getSelection) {
                var selection = window.getSelection();
                var range = document.createRange();
                range.selectNodeContents(_this.infoLink);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });
    };

    MenuView.prototype.showAwait = function (data) {
        this.hide(this.buttonsContainer);
        this.show(this.infoContainer);

        if(data.game) {
            var location = window.location;
            var url = location.protocol + '//' + location.host + location.pathname + '#' + data.game.id;

            this.infoText.innerHTML = 'Give the following link to your friend:';
            this.infoLink.innerHTML = url;
            this.infoLink.setAttribute('href', url);
        } else {
            this.infoText.innerHTML = 'Waiting for opponent...';
            this.infoLink.innerHTML = '';
            this.infoLink.setAttribute('src', '');
        }
    };

    MenuView.prototype.showButtons = function () {
        this.hide(this.infoContainer);
        this.show(this.buttonsContainer);
    };

    return MenuView;
})();