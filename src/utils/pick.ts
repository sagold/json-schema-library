import { isObject } from "../utils/isObject";

export function pick(value: Record<string, unknown>, ...properties: string[]) {
    if (!isObject(value) || properties.length === 0) {
        return value;
    }
    const result: Record<string, unknown> = {};
    properties.forEach((property) => (result[property] = value[property]));
    return result;
}
