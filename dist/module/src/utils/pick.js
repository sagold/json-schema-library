import { isObject } from "../utils/isObject.js";
export function pick(value, ...properties) {
    if (!isObject(value) || properties.length === 0) {
        return value;
    }
    const result = {};
    properties.forEach((property) => (result[property] = value[property]));
    return result;
}
