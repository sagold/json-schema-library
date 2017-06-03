const filter = require("./utils/filter");
const flattenArray = require("./utils/flattenArray");


/**
 * Validate data by a json schema
 *
 * @param  {CoreInterface} core - validator
 * @param  {Schema} schema      - json schema
 * @param  {Mixed} value        - value to validate
 * @param  {String} [pointer]   - json pointer pointing to value
 * @return {Array} list of errors or empty
 */
module.exports = function validateAsync(core, schema, value, pointer = "#") {
    const errors = core.validate(schema, value, pointer);

    return Promise
        .all(errors)
        .then(flattenArray)
        .then((resolvedErrors) => resolvedErrors.filter(filter.errorsOnly))
        .catch((e) => {
            console.log("Failed resolving promises", e.message);
            console.log(e.stack);
            throw e;
        });
};
