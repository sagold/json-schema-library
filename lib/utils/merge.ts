import deepmerge from "deepmerge";
// @ts-ignore
const overwriteMerge = (destinationArray, sourceArray) => sourceArray;

/**
 * returns a new json-schema, where properties are combined and arrays are replaced
 */
export default <T, K>(a: T, b: K): T & K => deepmerge(a, b, { arrayMerge: overwriteMerge });
