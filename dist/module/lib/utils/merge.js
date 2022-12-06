import deepmerge from "deepmerge";
const overwriteMerge = (destinationArray, sourceArray) => sourceArray;
/**
 * returns a new json-schema, where properties are combined and arrays are replaced
 */
export default (a, b) => deepmerge(a, b, { arrayMerge: overwriteMerge });
// var d = c.filter((item, pos) => c.indexOf(item) === pos)
const mergeUniqueItems = (destinationArray, sourceArray) => {
    const all = destinationArray.concat(sourceArray);
    return all.filter((item, pos) => all.indexOf(item) === pos);
};
/**
 * returns a new json-schema, where properties are combined and arrays are replaced
 */
export const mergeArraysUnique = (a, b) => deepmerge(a, b, { arrayMerge: mergeUniqueItems });
