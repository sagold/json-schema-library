import { JsonError, JsonPointer } from "../types";
export type ErrorData = {
    pointer: JsonPointer;
} & Record<string, unknown>;
export type CreateError = (data: ErrorData) => JsonError;
export declare function createError(name: string, data: ErrorData): JsonError;
/**
 * Creates a custom Error-Constructor which instances may be identified by `customError instanceof Error`. Its messages
 * are defined by strings-object @see config/strings.ts
 *
 * @param name - id of error (camelcased)
 * @return error constructor function
 */
export declare function createCustomError(name: string): CreateError;
