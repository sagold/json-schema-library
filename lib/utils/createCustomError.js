const __ = require("./__");

function dashCase(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

module.exports = function createCustomError(name) {
    function CustomError(data) {
        const message = __(name, data);
        const error = Error.call(this, message);
        Error.captureStackTrace(this, this);
        this.name = name;
        this.code = dashCase(name);
        this.stack = error.stack;
        this.message = message;
        this.data = data;
    }
    CustomError.prototype = Object.create(Error.prototype);
    CustomError.prototype.name = name;
    return CustomError;
};
