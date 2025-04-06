import { CreateError } from "./errors/createCustomError";
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
export declare function addError(name: string, errorMessage: string, createError?: CreateError): void;
/**
 * Replaces an error-message
 */
export declare function addErrorMessage(name: string, errorMessage: string): void;
