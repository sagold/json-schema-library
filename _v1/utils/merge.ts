import deepmerge from "deepmerge";

const overwriteMerge = (destinationArray: unknown[], sourceArray: unknown[]) => sourceArray;

/**
 * returns a new json-schema, where properties are combined and arrays are replaced
 */
export default <T>(a: Partial<T>, b: Partial<T>): T =>
    deepmerge(a, b, { arrayMerge: overwriteMerge });

// var d = c.filter((item, pos) => c.indexOf(item) === pos)
const mergeUniqueItems = (destinationArray: unknown[], sourceArray: unknown[]) => {
    const all = destinationArray.concat(sourceArray);
    return all.filter((item, pos) => all.indexOf(item) === pos);
};

/**
 * returns a new json-schema, where properties are combined and arrays are replaced
 */
export const mergeArraysUnique = <T>(a: Partial<T>, b: Partial<T>): T =>
    deepmerge(a, b, { arrayMerge: mergeUniqueItems });
