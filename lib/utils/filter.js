function isPromise(obj) {
    return obj && typeof obj.then === "function";
}

function isError(obj) {
    return obj && obj.type === "error";
}

module.exports = {
    errorOrPromise(error) {
        return isError(error) || isPromise(error);
    },
    errorsOnly(error) {
        return isError(error);
    }
};
