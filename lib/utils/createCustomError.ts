import __ from "./__";
import { JSONError } from "../types";


export interface CreateError {
    (data?: { [p : string]: any }): JSONError
}


function dashCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}


export function createError(name: string, data?: { [p : string]: any }): JSONError {
    return {
        type: "error",
        name,
        code: dashCase(name),
        message: __(name, data),
        data
    };
}


/**
 * Creates a custom Error-Constructor which instances may be identified by `customError instanceof Error`. Its messages
 * are defined by strings-object __@see config/strings.ts
 *
 * @param name - id of error (camelcased)
 * @return error constructor function
 */
export default function createCustomError(name: string): CreateError {
    return createError.bind(null, name);
}
