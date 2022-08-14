import { errorsOnly } from "./utils/filter";
import flattenArray from "./utils/flattenArray";
import { isJSONError } from "./types";
function createErrorNotification(onError) {
    return function notifyError(error) {
        if (Array.isArray(error)) {
            error = flattenArray(error);
            error.forEach(notifyError);
            return error;
        }
        if (isJSONError(error)) {
            onError(error);
        }
        return error;
    };
}
/**
 * @async
 * Validate data by a json schema
 *
 * @param core - validator
 * @param value - value to validate
 * @param options
 * @param options.schema - json schema to use, defaults to core.rootSchema
 * @param options.pointer - json pointer pointing to current value. Used in error reports
 * @param options.onError   - will be called for each error as soon as it is resolved
 * @return list of errors or empty
 */
export default function validateAsync(core, value, options) {
    const { schema, pointer, onError } = { schema: core.rootSchema, pointer: "#", ...options };
    let errors = core.validate(value, schema, pointer);
    if (onError) {
        errors = flattenArray(errors);
        const notifyError = createErrorNotification(onError);
        for (let i = 0; i < errors.length; i += 1) {
            if (errors[i] instanceof Promise) {
                errors[i].then(notifyError);
            }
            else if (isJSONError(errors[i])) {
                onError(errors[i]);
            }
        }
    }
    return Promise.all(errors)
        .then(flattenArray)
        .then((resolvedErrors) => resolvedErrors.filter(errorsOnly))
        .catch((e) => {
        console.log("Failed resolving promises", e.message);
        console.log(e.stack);
        throw e;
    });
}
