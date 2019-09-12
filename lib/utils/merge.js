const deepmerge = require("deepmerge");
const overwriteMerge = (destinationArray, sourceArray) => sourceArray;
module.exports = (a, b) => deepmerge(a, b, { arrayMerge: overwriteMerge });
