import __ from "./__";
function dashCase(text) {
    return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
export function createError(name, data) {
    return {
        type: "error",
        name,
        code: dashCase(name),
        message: __(name, data),
        data
    };
}
/**
 * Creates a custom Error Creator. Its messages are defined by strings-object @see config/strings.ts
 *
 * @param name - id of error (camelcased)
 * @return error constructor function
 */
export function createCustomError(name) {
    return createError.bind(null, name);
}
