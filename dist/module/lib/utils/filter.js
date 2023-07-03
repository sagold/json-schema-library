import { isJsonError } from "../types";
export function isPromise(obj) {
    return obj instanceof Promise;
}
export function errorOrPromise(error) {
    return isJsonError(error) || isPromise(error);
}
export function errorsOnly(error) {
    return isJsonError(error);
}
