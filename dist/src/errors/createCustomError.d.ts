import { JsonError, ErrorData } from "../types";
export type CreateError<T extends ErrorData = ErrorData> = (data: T) => JsonError<T>;
export declare function createError<T extends ErrorData = ErrorData>(name: string, data: T): JsonError<T>;
/**
 * Creates a custom Error Creator. Its messages are defined by strings-object @see config/strings.ts
 *
 * @param name - id of error (camelcased)
 * @return error constructor function
 */
export declare function createCustomError<T extends ErrorData = ErrorData>(name: string): CreateError<T>;
