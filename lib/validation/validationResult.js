const filter = require("../utils/filter");


module.exports = function validationResult(core, errors) {
    if (core.isAsync()) {
        return Promise.all(errors.filter(filter.errorsOnly));
    }
    return errors.filter(filter.errorsOnly);
};
