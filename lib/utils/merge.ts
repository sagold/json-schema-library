import deepmerge from "deepmerge";
const overwriteMerge = (destinationArray, sourceArray) => sourceArray;
export default <T, K>(a: T, b: K): T & K => deepmerge(a, b, { arrayMerge: overwriteMerge });
