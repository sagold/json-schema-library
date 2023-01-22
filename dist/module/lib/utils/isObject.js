import getTypeOf from "../getTypeOf";
export function isObject(v) {
    return getTypeOf(v) === "object";
}
