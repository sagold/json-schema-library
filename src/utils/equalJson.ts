import equal from "fast-deep-equal";
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
        const aPrototype = Object.getPrototypeOf(a);
        const bPrototype = Object.getPrototypeOf(b);
        if (
            (aPrototype !== Object.prototype && aPrototype !== null) ||
            (bPrototype !== Object.prototype && bPrototype !== null)
        ) {
            return equal(a, b);
        }
        const keys = Object.keys(a);
        return (
            keys.length === Object.keys(b).length &&
            keys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && equalJson(a[key], b[key]))
        );
    }
    return equal(a, b);
}
