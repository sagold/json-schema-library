function isPromise(obj) {
    return obj instanceof Promise;
}

function isError(obj) {
    return obj && obj.type === "error";
}

module.exports = {
    isError,
    isPromise,
    errorOrPromise(error) {
        return isError(error) || isPromise(error);
    },
    errorsOnly(error) {
        return isError(error);
    }
};
