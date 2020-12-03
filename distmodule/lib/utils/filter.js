function isPromise(obj) {
    return obj instanceof Promise;
}
function isError(obj) {
    return obj && obj.type === "error";
}
export default {
    isError,
    isPromise,
    errorOrPromise(error) {
        return isError(error) || isPromise(error);
    },
    errorsOnly(error) {
        return isError(error);
    }
};
