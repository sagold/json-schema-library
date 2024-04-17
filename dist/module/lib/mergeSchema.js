import getTypeOf from "./getTypeOf";
import { isObject } from "./utils/isObject";
export function mergeSchema(a, b, ...omit) {
    if ((b === null || b === void 0 ? void 0 : b.type) === "error") {
        return b;
    }
    else if ((a === null || a === void 0 ? void 0 : a.type) === "error") {
        return a;
    }
    const aType = getTypeOf(a);
    const bType = getTypeOf(b);
    if (aType !== bType) {
        return a;
    }
    const schema = mergeSchema2(a, b);
    for (let i = 0; i < omit.length; i += 1) {
        delete schema[omit[i]];
    }
    return schema;
}
export function mergeSchema2(a, b, property) {
    var _a;
    if (isObject(a) && isObject(b)) {
        const newObject = {};
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
                }
                else {
                    result.push((_a = b[i]) !== null && _a !== void 0 ? _a : a[i]);
                }
            }
            return result;
        }
        const result = [];
        const append = [];
        for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
            if (isObject(a[i]) && isObject(b[i])) {
                result[i] = mergeSchema2(a[i], b[i]);
            }
            else {
                if (a[i] !== undefined && b[i] !== undefined) {
                    result[i] = a[i];
                    append.push(b[i]);
                }
                else if (a[i] !== undefined) {
                    result[i] = a[i];
                }
                else if (b[i] !== undefined) {
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
