import { errorsOnly } from "./utils/filter";
import flattenArray from "./utils/flattenArray";
import { JSONSchema, JSONPointer, JSONError, isJSONError } from "./types";
import { Draft as Core } from "./draft";

function createErrorNotification(onError: OnError) {
    return function notifyError(error: JSONError | JSONError[]) {
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

export interface OnError {
    (error: JSONError): void;
}

export type Options = {
    schema?: JSONSchema;
    pointer?: JSONPointer;
    onError?: OnError;
};

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
export default function validateAsync(
    core: Core,
    value: any,
    options?: Options
): Promise<Array<JSONError>> {
    const { schema, pointer, onError } = { schema: core.rootSchema, pointer: "#", ...options };

    let errors: Array<JSONError> = core.validate(value, schema, pointer);
    if (onError) {
        errors = flattenArray(errors);
        const notifyError = createErrorNotification(onError);
        for (let i = 0; i < errors.length; i += 1) {
            if (errors[i] instanceof Promise) {
                errors[i].then(notifyError);
            } else if (isJSONError(errors[i])) {
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
