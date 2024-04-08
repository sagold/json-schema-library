import { isObject } from "./utils/isObject";
/**
 * Note: scope history = validation path ~ dynamic scope
 * This list should contain any subschema encountered
 */
function shallowCloneSchemaNode(node) {
    const result = { ...node };
    Object.defineProperty(result, "__compiled", { enumerable: false, value: true });
    Object.defineProperty(result, "__ref", { enumerable: false, value: node.__ref });
    Object.defineProperty(result, "getOneOfOrigin", { enumerable: false, value: node.getOneOfOrigin });
    Object.defineProperty(result, "getRoot", { enumerable: false, value: node.getRoot });
    return result;
}
/**
 * Omit properties from input schema. Accepts any number of properties to remove.
 * Example:
 *
 * ```ts
 * omit(myObject, "if", "dependencies");
 * ```
 * @returns shallow copy of input schema without specified properties
 */
function omit(object, ...keysToOmit) {
    const result = {};
    Object.keys(object).forEach((key) => {
        if (!keysToOmit.includes(key)) {
            result[key] = object[key];
        }
    });
    // @scope
    Object.defineProperty(result, "__scope", { enumerable: false, value: object.__scope });
    Object.defineProperty(result, "getOneOfOrigin", { enumerable: false, value: object.getOneOfOrigin });
    Object.defineProperty(result, "__compiled", { enumerable: false, value: true });
    Object.defineProperty(result, "__ref", { enumerable: false, value: object.__ref });
    Object.defineProperty(result, "getRoot", { enumerable: false, value: object.getRoot });
    return result;
}
/**
 * Create a shallow clone of the given schema-node
 */
function clone(schema) {
    const result = shallowCloneSchemaNode(schema);
    Object.defineProperty(result, "__scope", { enumerable: false, value: schema.__scope });
    return result;
}
/**
 * Get a new compiled schema node to pass on in validation. This will register the passed
 * json-schema to the validation-path, stored in `current > scope`.
 *
 * @param current - schema node (compiled schema) of current validation step (input)
 * @param next - next json-schema in validation step which does not yet refer to a new value (sharing json-pointer)
 * @returns new schema node to pass on to next validation methods
 */
function add(current, next) {
    var _a;
    if (!isObject(next)) {
        return next;
    }
    // @scope
    const { pointer = "?", history = [] } = ((_a = current.__scope) !== null && _a !== void 0 ? _a : {});
    const clone = shallowCloneSchemaNode(next);
    Object.defineProperty(clone, "__scope", { enumerable: false, value: { pointer, history: [...history, clone] } });
    return clone;
}
/**
 * Get a new compiled schema node to pass on in validation. This will register the passed
 * json-schema to the validation-path, stored in `current > scope`.
 *
 * @param current - schema node (compiled schema) of current validation step (input)
 * @param next - next json-schema in validation step which does  refer to a new value (new json-pointer)
 * @param key - next property-name or array-index `next` refers to
 * @returns new schema node to pass on to next validation methods
 */
function next(current, next, key) {
    var _a;
    if (!isObject(next)) {
        return next;
    }
    if (!isObject(current)) {
        return current;
    }
    const { pointer = "?", history = [] } = ((_a = current.__scope) !== null && _a !== void 0 ? _a : {});
    const clone = shallowCloneSchemaNode(next);
    Object.defineProperty(clone, "__scope", { enumerable: false, value: { pointer: `${pointer}/${key}`, history: [...history, clone] } });
    return clone;
}
export default {
    omit,
    clone,
    add,
    next
};
