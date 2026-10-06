import equal from "fast-deep-equal";
import { hasProperty } from "./hasProperty";
import { isObject } from "./isObject";

export function equalJson(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i += 1) {
            if (!equalJson(a[i], b[i])) return false;
        }
        return true;
    }
    if (isObject(a) && isObject(b)) {
        // Null-prototype maps are plain data. Keep other host objects on the existing comparator.
        const prototypes = [Object.getPrototypeOf(a), Object.getPrototypeOf(b)];
        if (prototypes.some((prototype) => prototype !== Object.prototype && prototype !== null)) {
            return equal(a, b);
        }
        const keys = Object.keys(a);
        const otherKeys = Object.keys(b);
        return (
            keys.length === otherKeys.length &&
            // hasProperty considers undefined absent; retain equality for that non-JSON case too.
            keys.every((key) => (hasProperty(b, key) || otherKeys.includes(key)) && equalJson(a[key], b[key]))
        );
    }
    return equal(a, b);
}
