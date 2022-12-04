import deepmerge from "deepmerge";
// @ts-ignore
const overwriteMerge = (destinationArray, sourceArray) => sourceArray;

/**
 * returns a new json-schema, where properties are combined and arrays are replaced
 */
export default <T>(a: Partial<T>, b: Partial<T>): T =>
    deepmerge(a, b, { arrayMerge: overwriteMerge });
