import { eachSchema } from "../../eachSchema";
// import remotes from "../../../remotes";
import joinScope from "../../compile/joinScope";
import getRef from "../../compile/getRef";
import { get } from "@sagold/json-pointer";
const COMPILED = "__compiled";
const COMPILED_REF = "__ref";
const GET_REF = "getRef";
const GET_ROOT = "getRoot";
const suffixes = /(#|\/)+$/g;
/**
 * @draft starting with _draft 06_ keyword `id` has been renamed to `$id`
 *
 * compiles the input root schema for $ref resolution and returns it again
 * @attention this modifies input schema but maintains object-structure
 *
 * for a compiled json-schema you can call getRef on any contained schema (location of type).
 * this resolves a $ref target to a valid schema (for a valid $ref)
 *
 * @param rootSchema root json-schema ($id, defs, ... ) to compile
 * @param [force] = false force compile json-schema
 * @return compiled json-schema
 */
export default function compileSchema(draft, schemaToCompile, rootSchema = schemaToCompile, force = false) {
    // @ts-ignore
    if (schemaToCompile === true || schemaToCompile === false || schemaToCompile === undefined) {
        return schemaToCompile;
    }
    if (schemaToCompile[COMPILED] !== undefined) {
        return schemaToCompile;
    } // eslint-disable-line
    const context = { ids: {}, remotes: draft.remotes };
    const rootSchemaAsString = JSON.stringify(schemaToCompile);
    const compiledSchema = JSON.parse(rootSchemaAsString);
    Object.defineProperty(compiledSchema, COMPILED, { enumerable: false, value: true });
    Object.defineProperty(compiledSchema, GET_REF, {
        enumerable: false,
        value: getRef.bind(null, context, compiledSchema)
    });
    // bail early, when no $refs are defined
    if (force === false && rootSchemaAsString.includes("$ref") === false) {
        return compiledSchema;
    }
    // compile this schema under rootSchema, making definitions available to $ref-resolution
    if (compiledSchema !== rootSchema) {
        Object.defineProperty(compiledSchema, "$defs", {
            enumerable: true,
            value: Object.assign({}, rootSchema.definitions, rootSchema.$defs, compiledSchema.definitions, compiledSchema.$defs)
        });
    }
    const scopes = {};
    const getRoot = () => compiledSchema;
    eachSchema(compiledSchema, (schema, pointer) => {
        var _a;
        if (schema.$id) {
            // if this is a schema being merged on root object, we cannot override
            // parents locations, but must reuse it
            if (schema.$id.startsWith("http") && /(allOf|anyOf|oneOf)\/\d+$/.test(pointer)) {
                const parentPointer = pointer.replace(/\/(allOf|anyOf|oneOf)\/\d+$/, "");
                const parentSchema = get(compiledSchema, parentPointer);
                schema.$id = (_a = parentSchema.$id) !== null && _a !== void 0 ? _a : schema.$id;
            }
            context.ids[schema.$id.replace(suffixes, "")] = pointer;
        }
        // build up scopes and add them to $ref-resolution map
        pointer = `#${pointer}`.replace(/##+/, "#");
        const previousPointer = pointer.replace(/\/[^/]+$/, "");
        const parentPointer = pointer.replace(/\/[^/]+\/[^/]+$/, "");
        const previousScope = scopes[previousPointer] || scopes[parentPointer];
        const scope = joinScope(previousScope, schema.$id);
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
    return compiledSchema;
}
