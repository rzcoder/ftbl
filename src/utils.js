module.exports.makeid = function (length) {
    length = length || 5;
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        text += possible.charAt(~~(Math.random() * possible.length));

    return text;
};

module.exports.clone2DArray = function (array) {
    var res = [];
    for(var i = 0; i < array.length; i++) {
        res.push(array[i].slice(0));
    }

    return res;
};