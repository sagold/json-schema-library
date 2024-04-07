import { JsonSchema } from "./types";
import { mergeArraysUnique } from "./utils/merge";
import getTypeOf from "./getTypeOf";
import { isObject } from "./utils/isObject";

/**
 * merges to two json schema. In case of conflicts, will use overwrite first
 * schema or directly return first json schema.
 */
export function _mergeSchema(a: JsonSchema, b: JsonSchema) {
    const aType = getTypeOf(a);
    const bType = getTypeOf(b);
    if (aType !== bType) {
        return a;
    }

    // @scope
    const result = mergeArraysUnique(a, b);
    Object.defineProperty(result, "__compiled", { enumerable: false, value: true });
    Object.defineProperty(result, "__scope", { enumerable: false, value: b.__scope ?? a.__scope });
    Object.defineProperty(result, "__ref", { enumerable: false, value: b.__ref ?? a.__ref });
    Object.defineProperty(result, "getOneOfOrigin", { enumerable: false, value: b.getOneOfOrigin ?? a.getOneOfOrigin });
    return result;
}

export function mergeSchema<T extends JsonSchema>(a: T, b: T): T {
    // console.log("a", JSON.stringify(a, null, 2));
    // console.log("b", JSON.stringify(b, null, 2));
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
    if (!isObject(schema)) {
        return schema;
    }

    // @scope
    Object.defineProperty(schema, "__scope", { enumerable: false, value: b.__scope ?? a.__scope });
    Object.defineProperty(schema, "__ref", { enumerable: false, value: b.__ref ?? a.__ref });
    Object.defineProperty(schema, "getOneOfOrigin", { enumerable: false, value: b.getOneOfOrigin ?? a.getOneOfOrigin });
    return schema;
}


export function mergeSchema2(a: unknown, b: unknown, property?: string): unknown {
    if (isObject(a) && isObject(b)) {
        const newObject: Record<string, unknown> = {};
        [...Object.keys(a), ...Object.keys(b)]
            .filter((item, index, array) => array.indexOf(item) === index)
            .forEach(key => (newObject[key] = mergeSchema2(a[key], b[key], key)));
        return newObject;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
        if (property === "required") {
            return a.concat(b).filter((item, index, array) => array.indexOf(item) === index);
        }
        if (property === "items") {
            const result = [];
            for (let i = 0; i < b.length; i += 1) {
                if (isObject(a[i]) && isObject(b[i]) && a[i].type === b[i].type) {
                    result[i] = mergeSchema2(a[i], b[i]);
                } else {
                    result.push(b[i] ?? a[i]);
                }
            }
            return result;
        }
        const result = [];
        const append = [];
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
