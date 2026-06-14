import { isObject } from "../utils/isObject";
import { hasProperty } from "./hasProperty";

export function getValue(data: unknown, key: string | number) {
    if (isObject(data) && hasProperty(data, `${key}`)) {
        return data[key];
    } else if (Array.isArray(data)) {
        return data[key as number];
    }
}
