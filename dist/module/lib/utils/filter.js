export function isPromise(obj) {
    return obj instanceof Promise;
}
export function isError(obj) {
    return obj && obj.type === "error";
}
export function errorOrPromise(error) {
    return isError(error) || isPromise(error);
}
export function errorsOnly(error) {
    return isError(error);
}
