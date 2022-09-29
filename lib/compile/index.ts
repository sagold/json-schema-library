/* eslint max-statements-per-line: ["error", { "max": 2 }] */
import { eachSchema } from "../eachSchema";
import { Draft } from "../draft";
import joinScope from "./joinScope";
import getRef from "./getRef";
import { JSONSchema } from "../types";
import { Context } from "./types";

const COMPILED = "__compiled";
const COMPILED_REF = "__ref";
const GET_REF = "getRef";
const GET_ROOT = "getRoot";
const suffixes = /(#|\/)+$/g;

/**
 * compiles the input root schema for `$ref` resolution and returns it again
 * @attention this modifies input schema but maintains object-structure
 *
 * for a compiled json-schema you can call getRef on any contained schema (location of type).
 * this resolves a $ref target to a valid schema (for a valid $ref)
 *
 * @param draft
 * @param schemaToCompile - json-schema to compile
 * @param [rootSchema] - compiled root json-schema to use for definitions resolution
 * @param [force] = false - force compile json-schema
 * @return compiled copy of input json-schema
 */
export default function compileSchema(
    draft: Draft,
    schemaToCompile: JSONSchema,
    rootSchema: JSONSchema = schemaToCompile,
    force = false
): JSONSchema {
    if (!schemaToCompile || schemaToCompile[COMPILED] !== undefined) {
        return schemaToCompile;
    }

    const context: Context = { ids: {}, remotes: draft.remotes };
    const rootSchemaAsString = JSON.stringify(schemaToCompile);
    const compiledSchema: JSONSchema = JSON.parse(rootSchemaAsString);

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
    if (schemaToCompile !== rootSchema) {
        Object.defineProperty(compiledSchema, "definitions", {
            enumerable: false,
            value: Object.assign(
                {},
                rootSchema.definitions,
                rootSchema.$defs,
                schemaToCompile.definitions,
                schemaToCompile.$defs
            )
        });
    }

    const scopes: Record<string, string> = {};
    const getRoot = () => compiledSchema;
    eachSchema(compiledSchema, (schema, pointer) => {
        if (schema.id) {
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
