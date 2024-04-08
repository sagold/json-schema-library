import { JsonSchema } from "./types";
/**
 * Omit properties from input schema. Accepts any number of properties to remove.
 * Example:
 *
 * ```ts
 * omit(myObject, "if", "dependencies");
 * ```
 * @returns shallow copy of input schema without specified properties
 */
declare function omit(object: JsonSchema, ...keysToOmit: string[]): Record<string, unknown>;
/**
 * Create a shallow clone of the given schema-node
 */
declare function clone(schema: JsonSchema): {
    [x: string]: any;
};
/**
 * Get a new compiled schema node to pass on in validation. This will register the passed
 * json-schema to the validation-path, stored in `current > scope`.
 *
 * @param current - schema node (compiled schema) of current validation step (input)
 * @param next - next json-schema in validation step which does not yet refer to a new value (sharing json-pointer)
 * @returns new schema node to pass on to next validation methods
 */
declare function add(current: JsonSchema, next: JsonSchema): JsonSchema;
/**
 * Get a new compiled schema node to pass on in validation. This will register the passed
 * json-schema to the validation-path, stored in `current > scope`.
 *
 * @param current - schema node (compiled schema) of current validation step (input)
 * @param next - next json-schema in validation step which does  refer to a new value (new json-pointer)
 * @param key - next property-name or array-index `next` refers to
 * @returns new schema node to pass on to next validation methods
 */
declare function next(current: JsonSchema, next: JsonSchema, key: string | number): JsonSchema;
declare const _default: {
    omit: typeof omit;
    clone: typeof clone;
    add: typeof add;
    next: typeof next;
};
export default _default;
