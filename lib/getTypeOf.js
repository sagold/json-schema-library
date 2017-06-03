const toString = Object.prototype.toString;

module.exports = function getTypeOf(value) {
    // eslint-disable-next-line newline-per-chained-call
    return toString.call(value).match(/\s([^\]]+)\]/).pop().toLowerCase();
};
