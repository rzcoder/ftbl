module.exports = (function () {

    function View(client) {
        this.client = client;
        this.network = client.network;

        this.container = document.querySelector('.startview');
        this.buttonsContainer = document.querySelector('.startview .buttons');
        this.buttons = {
            'open': document.querySelector('.startview button[data-role="open"]'),
            'new': document.querySelector('.startview button[data-role="new"]')
        };

        this.infoContainer = document.querySelector('.startview .info');
        this.infoText = document.querySelector('.startview .info .infoText');
        this.infoLink = document.querySelector('.startview .info .infoLink');
        this.setEvents();
    }

    View.prototype.init = function (){
        this.show(this.buttonsContainer);
        this.hide(this.infoContainer);
    };

    View.prototype.show = function (el) {
        var el = el || this.container;
        el.className = el.className.replace('hidden', '');
    };

    View.prototype.hide = function (el) {
        var el = el || this.container;
        el.className = el.className.replace('hidden', '') + ' hidden';
    };

    View.prototype.setEvents = function () {
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

    View.prototype.showAwait = function (data) {
        this.hide(this.buttonsContainer);
        this.show(this.infoContainer);

        if(data.game) {
            var location = window.location;
            var url = location.protocol + '//' + location.host + location.pathname + '#' + data.game.id;

            this.infoText.innerText = 'Give the following link to your friend:';
            this.infoLink.innerText = url;
            this.infoLink.setAttribute('href', url);
        } else {
            this.infoText.innerText = 'Waiting for opponent...';
            this.infoLink.innerText = '';
            this.infoLink.setAttribute('src', '');
        }

    };

    return View;
})();