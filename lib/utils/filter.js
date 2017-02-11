module.exports = {
    errorsOnly(error) {
        return error && error.type === "error";
    }
};
