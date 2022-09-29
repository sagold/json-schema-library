import __ from "./__";
function dashCase(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
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
 * Creates a custom Error-Constructor which instances may be identified by `customError instanceof Error`. Its messages
 * are defined by strings-object __@see config/strings.ts
 *
 * @param name - id of error (camelcased)
 * @return error constructor function
 */
export default function createCustomError(name) {
    return createError.bind(null, name);
}
