/* eslint max-statements-per-line: ["error", { "max": 2 }] */
import { eachSchema } from "../eachSchema";
import joinScope from "./joinScope";
import getRef from "./getRef";
import { get } from "@sagold/json-pointer";
const COMPILED = "__compiled";
const COMPILED_REF = "__ref";
const GET_REF = "getRef";
const GET_ROOT = "getRoot";
const suffixes = /(#|\/)+$/g;
/**
 * compiles the input root schema for `$ref` resolution and returns it again
 * @attention this modifies input schema but maintains data-structure and thus returns
 * the same object with JSON.stringify
 *
 * for a compiled json-schema you can call getRef on any contained schema (location of type).
 * this resolves a $ref target to a valid schema (for a valid $ref)
 *
 * @param draft
 * @param schemaToCompile - json-schema to compile
 * @param [rootSchema] - compiled root json-schema to use for definitions resolution
 * @param [force] = false - force compile json-schema
 * @return compiled input json-schema
 */
export default function compileSchema(draft, schemaToCompile, rootSchema = schemaToCompile, force = false) {
    if (!schemaToCompile || schemaToCompile[COMPILED] !== undefined) {
        return schemaToCompile;
    }
    const context = { ids: {}, remotes: draft.remotes };
    const rootSchemaAsString = JSON.stringify(schemaToCompile);
    const compiledSchema = JSON.parse(rootSchemaAsString);
    // flag this schema as compiled
    Object.defineProperty(compiledSchema, COMPILED, { enumerable: false, value: true });
    // add getRef-helper to this object
    Object.defineProperty(compiledSchema, GET_REF, {
        enumerable: false,
        value: getRef.bind(null, context, compiledSchema)
    });
    // bail early, when no $refs are defined
    if (force === false && rootSchemaAsString.includes("$ref") === false) {
        return compiledSchema;
    }
    // compile this schema under rootSchema, making definitions available to $ref-resolution
    if (schemaToCompile !== rootSchema) {
        Object.defineProperty(compiledSchema, "definitions", {
            enumerable: false,
            value: Object.assign({}, rootSchema.definitions, rootSchema.$defs, schemaToCompile.definitions, schemaToCompile.$defs)
        });
    }
    const scopes = {};
    const getRoot = () => compiledSchema;
    eachSchema(compiledSchema, (schema, pointer) => {
        var _a;
        if (schema.id) {
            // if this is a schema being merged on root object, we cannot override
            // parents locations, but must reuse it
            if (schema.id.startsWith("http") && /(allOf|anyOf|oneOf)\/\d+$/.test(pointer)) {
                const parentPointer = pointer.replace(/\/(allOf|anyOf|oneOf)\/\d+$/, "");
                const parentSchema = get(compiledSchema, parentPointer);
                schema.id = (_a = parentSchema.id) !== null && _a !== void 0 ? _a : schema.id;
            }
            context.ids[schema.id.replace(suffixes, "")] = pointer;
        }
        // build up scopes and add them to $ref-resolution map
        pointer = `#${pointer}`.replace(/##+/, "#");
        const previousPointer = pointer.replace(/\/[^/]+$/, "");
        const parentPointer = pointer.replace(/\/[^/]+\/[^/]+$/, "");
        const previousScope = scopes[previousPointer] || scopes[parentPointer];
        const scope = joinScope(previousScope, schema.id);
        scopes[pointer] = scope;
        if (context.ids[scope] == null) {
            context.ids[scope] = pointer;
        }
        if (schema.$ref && !schema[COMPILED_REF]) {
            Object.defineProperty(schema, COMPILED_REF, {
                enumerable: false,
                value: joinScope(scope, schema.$ref)
            });
            // @todo currently not used:
            Object.defineProperty(schema, GET_ROOT, { enumerable: false, value: getRoot });
            // console.log("compiled ref", scope, schema.$ref, "=>", joinScope(scope, schema.$ref));
        }
    });
    // console.log(JSON.stringify(context.ids, null, 2));
    return compiledSchema;
}
