import { isJSONError, JSONError } from "../types";

export function isPromise(obj: unknown): obj is Promise<unknown> {
    return obj instanceof Promise;
}

export function errorOrPromise(error: unknown): error is JSONError | Promise<unknown> {
    return isJSONError(error) || isPromise(error);
}

export function errorsOnly(error: unknown): error is JSONError {
    return isJSONError(error);
}
