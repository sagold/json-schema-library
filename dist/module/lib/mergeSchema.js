import { mergeArraysUnique } from "./utils/merge";
import getTypeOf from "./getTypeOf";
/**
 * merges to two json schema. In case of conflicts, will use overwrite first
 * schema or directly return first json schema.
 */
export function mergeSchema(a, b) {
    const aType = getTypeOf(a);
    const bType = getTypeOf(b);
    if (aType !== bType) {
        return a;
    }
    return mergeArraysUnique(a, b);
}
