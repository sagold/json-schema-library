import { JsonSchema, SchemaScope } from "./types";
import { isObject } from "./utils/isObject";
// import copy from "./utils/copy";

/**
 * Note: scope history = validation path ~ dynamic scope
 * This list should contain any subschema encountered
 */

/**
 * Omit properties from input schema. Accepts any number of properties to
 * remove. Example:
 *
 * ```ts
 * omit(myObject, "if", "dependencies");
 * ```
 * @returns shallow copy of input schema without specified properties
 */
function omit(object: JsonSchema, ...keysToOmit: string[]) {
    const result: Record<string, unknown> = {};
    Object.keys(object).forEach((key) => {
        if (!keysToOmit.includes(key)) {
            result[key] = object[key];
        }
    });
    // @scope
    Object.defineProperty(result, "__compiled", { enumerable: false, value: true });
    Object.defineProperty(result, "__scope", { enumerable: false, value: object.__scope });
    Object.defineProperty(result, "__ref", { enumerable: false, value: object.__ref });
    Object.defineProperty(result, "getOneOfOrigin", { enumerable: false, value: object.getOneOfOrigin });
    return result;
}

function clone(schema: JsonSchema) {
    // const result = copy(schema);
    const result = { ...schema };
    Object.defineProperty(result, "__compiled", { enumerable: false, value: true });
    Object.defineProperty(result, "__scope", { enumerable: false, value: schema.__scope });
    Object.defineProperty(result, "__ref", { enumerable: false, value: schema.__ref });
    Object.defineProperty(result, "getOneOfOrigin", { enumerable: false, value: schema.getOneOfOrigin });
    return result;
}

function addScope(schema: JsonSchema, scope: SchemaScope) {
    if (!isObject(schema)) {
        return schema;
    }
    // @scope
    const clone = { ...schema };
    Object.defineProperty(clone, "__compiled", { enumerable: false, value: true });
    Object.defineProperty(clone, "__scope", { enumerable: false, value: scope });
    Object.defineProperty(clone, "__ref", { enumerable: false, value: schema.__ref });
    Object.defineProperty(clone, "getOneOfOrigin", { enumerable: false, value: schema.getOneOfOrigin });
    return clone;
}

function next(key: string | number, schema: JsonSchema, parentSchema: JsonSchema) {
    const scope = parentSchema.__scope ?? { pointer: `?/${key}`, history: [] };
    // if (scope == null) {
    //     throw new Error("missing parent scope");
    // }
    return newScope(schema, {
        pointer: `${scope.pointer}/${key}`,
        history: [...scope.history]
    })
}

/**
 * creates a new scope in history based on the passed schema
 */
function newScope(schema: JsonSchema, scope: SchemaScope) {
    if (!isObject(schema)) {
        return schema;
    }
    // @scope
    const clone: JsonSchema = { ...schema };
    Object.defineProperty(clone, "__compiled", { enumerable: false, value: true });
    Object.defineProperty(clone, "__scope", { enumerable: false, value: scope });
    Object.defineProperty(clone, "__ref", { enumerable: false, value: schema.__ref });
    Object.defineProperty(clone, "getOneOfOrigin", { enumerable: false, value: schema.getOneOfOrigin });
    const history = scope.history;
    history.push(clone);
    return clone;
}

export default {
    omit,
    clone,
    next,
    newScope,
    addScope
}
