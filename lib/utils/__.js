const strings = require("../config/strings");
const render = require("./render");

module.exports = function __(keyword, data, fallback = keyword) {
    const template = strings[keyword] || fallback;
    return render(template, data);
};
