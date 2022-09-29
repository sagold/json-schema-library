import { isJSONError } from "../types";
export function isPromise(obj) {
    return obj instanceof Promise;
}
export function errorOrPromise(error) {
    return isJSONError(error) || isPromise(error);
}
export function errorsOnly(error) {
    return isJSONError(error);
}
