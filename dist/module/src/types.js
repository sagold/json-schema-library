import { isObject } from "./utils/isObject";
/**
 * ts type guard for json error
 * @returns true if passed type is a JsonError
 */
export function isJsonError(error) {
    return (error === null || error === void 0 ? void 0 : error.type) === "error";
}
export function isSchemaNode(value) {
    return isObject(value) && Array.isArray(value === null || value === void 0 ? void 0 : value.reducers) && Array.isArray(value === null || value === void 0 ? void 0 : value.resolvers);
}
