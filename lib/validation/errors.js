const __ = require("../utils/__.js");

const errors = {
    MinLengthError: function (data) {
        this.name = "minLengthError";
        const message = __(this.name, data);
        const error = Error.call(this, message);
        this.stack = error.stack;
        this.message = message;
        this.data = data;
    }
};

module.exports = errors;
