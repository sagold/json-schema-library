const strings = require("../config/strings");
const render = require("./render");

/**
 * Renders the given string as defined in __@see config/strings.js__
 * @param  {String} keyword
 * @param  {Object} data        - template data
 * @param  {String} fallback    - fallback template
 * @return {String} resultugn string
 */
module.exports = function __(keyword, data, fallback = keyword) {
    const template = strings[keyword] || fallback;
    return render(template, data);
};
