const filter = require("./utils/filter");
const flattenArray = require("./utils/flattenArray");


function createErrorNotification(onError) {
    return function notifyError(error) {
        if (Array.isArray(error)) {
            error = flattenArray(error);
            error.forEach(notifyError);
            return error;
        }
        if (filter.isError(error)) {
            onError(error);
        }
        return error;
    };
}


/**
 * @async
 * Validate data by a json schema
 *
 * @param  {CoreInterface} core         - validator
 * @param  {Mixed} value                - value to validate
 * @param  {Object} options
 * @param  {Schema} options.schema      - json schema to use, defaults to core.rootSchema
 * @param  {String} options.pointer     - json pointer pointing to current value. Used in error reports
 * @param  {Function} options.onError   - will be called for each error as soon as it is resolved
 * @return {Promise<Array>} list of errors or empty
 */
module.exports = function validateAsync(core, value, { schema = core.rootSchema, pointer = "#", onError }) {
    let errors = core.validate(value, schema, pointer);

    if (onError) {
        errors = flattenArray(errors);
        const notifyError = createErrorNotification(onError);
        for (let i = 0; i < errors.length; i += 1) {
            if (errors[i] instanceof Promise) {
                errors[i].then(notifyError);
            } else if (filter.isError(errors[i])) {
                onError(errors[i]);
            }
        }
    }

    return Promise
        .all(errors)
        .then(flattenArray)
        .then(resolvedErrors => resolvedErrors.filter(filter.errorsOnly))
        .catch(e => {
            console.log("Failed resolving promises", e.message);
            console.log(e.stack);
            throw e;
        });
};
