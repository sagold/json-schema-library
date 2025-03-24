import { isObject } from "../utils/isObject";
export function getValue(data, key) {
    if (isObject(data)) {
        return data[key];
    }
    else if (Array.isArray(data)) {
        return data[key];
    }
}
