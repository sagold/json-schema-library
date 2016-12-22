const __ = require("../utils/__.js");

const errors = {
    MinLengthError: function (data) {
        this.name = "MinLengthError";
        const message = __(this.name, data);
        const error = Error.call(this, message);
        this.stack = error.stack;
        this.message = message;
        this.data = data;
    },
    MaxLengthError: function (data) {
        this.name = "MaxLengthError";
        const message = __(this.name, data);
        const error = Error.call(this, message);
        this.stack = error.stack;
        this.message = message;
        this.data = data;
    }
};

module.exports = errors;
