import { JsonSchema } from "../types";
import { getTypeOf } from "./getTypeOf";
import { isObject } from "./isObject";

export function mergeSchema<T extends JsonSchema>(a: T, b: T, ...omit: string[]): T {
    if (b?.type === "error") {
        return b;
    } else if (a?.type === "error") {
        return a;
    }

    const aType = getTypeOf(a);
    const bType = getTypeOf(b);
    if (aType !== bType) {
        return a;
    }

    const schema = mergeSchema2(a, b) as T;
    for (const s of omit) {
        delete schema[s]; // eslint-disable-line @typescript-eslint/no-dynamic-delete
    }

    return schema;
}

export function mergeSchema2(a: unknown, b: unknown, property?: string): unknown {
    if (isObject(a) && isObject(b)) {
        const newObject: Record<string, unknown> = {};
        [...Object.keys(a), ...Object.keys(b)]
            .filter((item, index, array) => array.indexOf(item) === index)
            .forEach((key) => (newObject[key] = mergeSchema2(a[key], b[key], key)));
        return newObject;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
        if (property === "required" || property === "anyOf") {
            return a.concat(b).filter((item, index, array) => array.indexOf(item) === index);
        }
        if (property === "items" || property === "prefixItems") {
            const result: unknown[] = [];
            for (let i = 0; i < b.length; i += 1) {
                if (isObject(a[i]) && isObject(b[i]) && a[i].type === b[i].type) {
                    result[i] = mergeSchema2(a[i], b[i]);
                } else {
                    result.push(b[i] ?? a[i]);
                }
            }
            return result;
        }
        const result: unknown[] = [];
        const append: unknown[] = [];
        for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
            if (isObject(a[i]) && isObject(b[i])) {
                result[i] = mergeSchema2(a[i], b[i]);
            } else {
                if (a[i] !== undefined && b[i] !== undefined) {
                    result[i] = a[i];
                    append.push(b[i]);
                } else if (a[i] !== undefined) {
                    result[i] = a[i];
                } else if (b[i] !== undefined) {
                    append.push(b[i]);
                }
            }
        }
        return [...result, ...append].filter((item, index, array) => array.indexOf(item) === index);
    }

    if (Array.isArray(b)) {
        return b;
    }

    if (Array.isArray(a)) {
        return a;
    }

    if (b !== undefined) {
        return b;
    }

    return a;
}
