import { errors } from "./errors/errors";
import { strings } from "./errors/strings";
import { createCustomError } from "./errors/createCustomError";
/**
 * Registers (or overwrotes) an error that can be called by
 *
 * ```ts
 *  node.errors[name]({ schema, pointer, value });
 * ```
 *
 * @param name - camelCased name of error
 * @param errorMessage - template string whoch can resolve handlebars, e.g. {{ value }} to resolve data
 */
export function addError(name, errorMessage, createError) {
    errors[name] = createError !== null && createError !== void 0 ? createError : createCustomError(name);
    strings[name] = errorMessage;
}
/**
 * Replaces an error-message
 */
export function addErrorMessage(name, errorMessage) {
    strings[name] = errorMessage;
}
