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
 * Validate data by a json schema
 *
 * @param  {CoreInterface} core     - validator
 * @param  {Schema} schema          - json schema
 * @param  {Mixed} value            - value to validate
 * @param  {String} [pointer]       - json pointer pointing to value
 * @param  {Function} [onError]     - will be called for each error as soon as it is resolved
 * @return {Array} list of errors or empty
 */
module.exports = function validateAsync(core, value, schema = core.rootSchema, pointer = "#", onError) {
    let errors = core.validate(schema, value, pointer);

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
