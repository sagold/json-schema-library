import __ from "./__";
import { JSONError, JSONPointer } from "../types";

export type ErrorData = { pointer: JSONPointer } & Record<string, unknown>;
export type CreateError = (data: ErrorData) => JSONError;

function dashCase(text: string): string {
    return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function createError(name: string, data: ErrorData): JSONError {
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
 * are defined by strings-object @see config/strings.ts
 *
 * @param name - id of error (camelcased)
 * @return error constructor function
 */
export function createCustomError(name: string): CreateError {
    return createError.bind(null, name);
}
