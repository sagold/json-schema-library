import { isObject } from "../utils/isObject";

export function getValue(data: unknown, key: string | number) {
    if (isObject(data)) {
        return data[key];
    } else if (Array.isArray(data)) {
        return data[key as number];
    }
}
