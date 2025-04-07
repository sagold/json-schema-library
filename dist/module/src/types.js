import { isSchemaNode } from "./SchemaNode";
export { isSchemaNode };
/**
 * ts type guard for json error
 * @returns true if passed type is a JsonError
 */
export function isJsonError(error) {
    return (error === null || error === void 0 ? void 0 : error.type) === "error";
}
