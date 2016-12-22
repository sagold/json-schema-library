module.exports = function render(template, data = {}) {
    return template.replace(/\{\{\w+\}\}/g, (match) => data[match.replace(/[{}]/g, "")]);
};
