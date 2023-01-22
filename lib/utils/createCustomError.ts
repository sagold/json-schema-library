import __ from "./__";
import { JsonError, JsonPointer } from "../types";

export type ErrorData = { pointer: JsonPointer } & Record<string, unknown>;
export type CreateError = (data: ErrorData) => JsonError;

function dashCase(text: string): string {
    return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function createError(name: string, data: ErrorData): JsonError {
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
