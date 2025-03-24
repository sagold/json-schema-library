import __ from "./__";
import { JsonError, ErrorData } from "../types";

export type CreateError<T extends ErrorData = ErrorData> = (data: T) => JsonError<T>;

function dashCase(text: string): string {
    return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function createError<T extends ErrorData = ErrorData>(name: string, data: T): JsonError<T> {
    return {
        type: "error",
        name,
        code: dashCase(name),
        message: __(name, data),
        data
    };
}

/**
 * Creates a custom Error Creator. Its messages are defined by strings-object @see config/strings.ts
 *
 * @param name - id of error (camelcased)
 * @return error constructor function
 */
export function createCustomError<T extends ErrorData = ErrorData>(name: string): CreateError<T> {
    return createError.bind(null, name) as CreateError<T>;
}
