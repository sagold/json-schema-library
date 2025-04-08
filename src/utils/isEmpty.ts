import { getTypeOf } from "./getTypeOf";

export function isEmpty(v: unknown): boolean {
    const type = getTypeOf(v);
    switch (type) {
        case "string":
        case "array":
            // @ts-expect-error tested as array - could use ts type guard
            return v?.length === 0;
        case "null":
        case "undefined":
            return true;
        case "object":
            return Object.keys(v).length === 0;
        default:
            return false;
    }
}
