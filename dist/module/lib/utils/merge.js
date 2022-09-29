import deepmerge from "deepmerge";
// @ts-ignore
const overwriteMerge = (destinationArray, sourceArray) => sourceArray;
/**
 * returns a new json-schema, where properties are combined and arrays are replaced
 */
export default (a, b) => deepmerge(a, b, { arrayMerge: overwriteMerge });
