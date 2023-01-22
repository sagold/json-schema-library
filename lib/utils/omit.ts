/**
 * Omit properties from input object. Accepts any number of properties to
 * remove. Example:
 *
 * ```ts
 * omit(myObject, "if", "dependencies");
 * ```
 *
 * @returns shallow copy of input object without specified properties
 */
export function omit(object: Record<string, unknown>, ...keysToOmit: string[]) {
    const result: Record<string, unknown> = {};
    Object.keys(object).forEach((key) => {
        if (!keysToOmit.includes(key)) {
            result[key] = object[key];
        }
    });
    if (object.getOneOfOrigin) {
        Object.defineProperty(result, "getOneOfOrigin", {
            enumerable: false,
            value: object.getOneOfOrigin
        });
    }
    return result;
}
