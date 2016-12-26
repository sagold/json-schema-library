module.exports = {
    errorsOnly(error) {
        return error instanceof Error;
    }
};
