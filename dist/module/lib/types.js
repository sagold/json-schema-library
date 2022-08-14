/**
 * ts type guard for json error
 * @returns true if passed type is a JSONError
 */
export function isJSONError(error) {
    return (error === null || error === void 0 ? void 0 : error.type) === "error";
}
