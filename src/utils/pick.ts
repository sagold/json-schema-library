import { isObject } from "../utils/isObject";

export function pick<T extends { [P in keyof T]: unknown }, K extends keyof T>(value: T, ...properties: K[]) {
    if (!isObject(value) || properties.length === 0) {
        return value;
    }
    const result = {} as Pick<T, K>;
    properties.forEach((property) => {
        if (value[property] !== undefined) {
            result[property] = value[property];
        }
    });
    return result;
}
