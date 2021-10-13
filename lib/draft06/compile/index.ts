/* eslint max-statements-per-line: ["error", { "max": 2 }] */
import eachSchema from "../../eachSchema";
import remotes from "../../../remotes";
import joinScope from "../../compile/joinScope";
import getRef from "../../compile/getRef";
import { JSONSchema } from "../../types";

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
export default function compile(rootSchema: JSONSchema, force = false): JSONSchema {
    // @ts-ignore
    if (rootSchema === true || rootSchema === false) {
        return rootSchema;
    }
    if (rootSchema[COMPILED] !== undefined) { return rootSchema; } // eslint-disable-line
    const context = { ids: {}, remotes: Object.assign({}, remotes) };
    const rootSchemaAsString = JSON.stringify(rootSchema);
    rootSchema = JSON.parse(rootSchemaAsString);
    Object.defineProperty(rootSchema, COMPILED, { enumerable: false, value: true });
    Object.defineProperty(rootSchema, GET_REF, { enumerable: false, value: getRef.bind(null, context, rootSchema) });

    if (force === false && rootSchemaAsString.includes("$ref") === false) {
        // bail early, when no $refs are defined
        return rootSchema;
    }

    const scopes = {};
    const getRoot = () => rootSchema;
    eachSchema(rootSchema, (schema, pointer) => {
        if (schema.$id) { context.ids[schema.$id.replace(suffixes, "")] = pointer; }

        // build up scopes and add them to $ref-resolution map
        pointer = `#${pointer}`.replace(/##+/, "#");
        const previousPointer = pointer.replace(/\/[^/]+$/, "");
        const parentPointer = pointer.replace(/\/[^/]+\/[^/]+$/, "");
        const previousScope = scopes[previousPointer] || scopes[parentPointer];
        const scope = joinScope(previousScope, schema.$id);
        scopes[pointer] = scope;
        if (context.ids[scope] == null) { context.ids[scope] = pointer; }

        if (schema.$ref) {
            Object.defineProperty(schema, COMPILED_REF, { enumerable: false, value: joinScope(scope, schema.$ref) });
            // @todo currently not used:
            Object.defineProperty(schema, GET_ROOT, { enumerable: false, value: getRoot });
            // console.log("compiled ref", scope, schema.$ref, "=>", joinScope(scope, schema.$ref));
        }
    });

    return rootSchema;
}
