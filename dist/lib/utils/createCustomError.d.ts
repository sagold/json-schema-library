import { JSONError } from "../types";
export interface CreateError {
    (data?: {
        [p: string]: any;
    }): JSONError;
}
export declare function createError(name: string, data?: {
    [p: string]: any;
}): JSONError;
/**
 * Creates a custom Error-Constructor which instances may be identified by `customError instanceof Error`. Its messages
 * are defined by strings-object __@see config/strings.ts
 *
 * @param name - id of error (camelcased)
 * @return error constructor function
 */
export default function createCustomError(name: string): CreateError;
