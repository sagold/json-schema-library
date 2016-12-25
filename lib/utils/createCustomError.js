const __ = require("./__");

function dashCase(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}


/**
 * Creates a custom Error-Constructor which instances may be identified by `customError instanceof Error`. Its messages
 * are defined by strings-object __@see config/strings.js__sa
 * @param  {String} name    - id of error (camelcased)
 * @return {Function} Error-Contructor
 */
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
