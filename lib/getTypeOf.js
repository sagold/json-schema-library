module.exports = function getTypeOf(value) {
    // eslint-disable-next-line newline-per-chained-call
    return Object.prototype.toString.call(value).match(/\s([^\]]+)\]/).pop().toLowerCase();
};
