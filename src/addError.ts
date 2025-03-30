import { errors } from "./errors/errors";
import { strings } from "./errors/strings";
import { CreateError, createCustomError } from "./errors/createCustomError";

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
export function addError(name: string, errorMessage: string, createError?: CreateError) {
    errors[name] = createError ?? createCustomError(name);
    strings[name] = errorMessage;
}

/**
 * Replaces an error-message
 */
export function addErrorMessage(name: string, errorMessage: string) {
    strings[name] = errorMessage;
}
