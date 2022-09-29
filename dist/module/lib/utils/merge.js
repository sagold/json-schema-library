import deepmerge from "deepmerge";
const overwriteMerge = (destinationArray, sourceArray) => sourceArray;
export default (a, b) => deepmerge(a, b, { arrayMerge: overwriteMerge });
