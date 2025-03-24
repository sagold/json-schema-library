import { isJsonError, JsonError } from "../types";

export function isPromise(obj: unknown): obj is Promise<unknown> {
    return obj instanceof Promise;
}

export function errorOrPromise(error: unknown): error is JsonError | Promise<unknown> {
    return isJsonError(error) || isPromise(error);
}

export function errorsOnly(error: unknown): error is JsonError {
    return isJsonError(error);
}
