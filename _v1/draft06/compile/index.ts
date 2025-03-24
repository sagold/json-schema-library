/* eslint max-statements-per-line: ["error", { "max": 2 }] */
import { Draft } from "../../draft";
import { eachSchema } from "../../eachSchema";
// import remotes from "../../../remotes";
import joinScope from "../../compile/joinScope";
import getRef from "../../compile/getRef";
import { JsonSchema } from "../../types";
import { get } from "@sagold/json-pointer";

const COMPILED = "__compiled";
const COMPILED_REF = "__ref";
const GET_REF = "getRef";
const GET_ROOT = "getRoot";
const GET_CONTEXT = "getContext";
const suffixes = /(#|\/)+$/g;

/**
 * Context is the state of a compiled json-schema. A context stores only
 * information of the current json-schema (id/scope) and retrievable references
 * are only related to the current json-schema.
 * It is protected in private scope.
 */
type Context = {
    ids: Record<string, unknown>;
    remotes: Record<string, JsonSchema>;
    anchors: Record<string, string>;
};

/**
 * @draft 6, 2019-09
 * - starting with _draft 2019-09_ plain name fragments are no longer defined with $id,
 *  but instead with the new keyword $anchor (which has a different syntax)
 *  https://json-schema.org/draft/2019-09/release-notes#incompatible-changes
 * - in _draft 2019-09_ only $recursiveAnchor and $recursiveRef have been introduced
 * - starting with _draft 6_ id is named $id
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
export default function compileSchema(
    draft: Draft,
    schemaToCompile: JsonSchema,
    rootSchema = schemaToCompile,
    force = false
): JsonSchema {
    // @ts-expect-error incomplete JsonSchema type
    if (schemaToCompile === true || schemaToCompile === false || schemaToCompile === undefined) {
        return schemaToCompile;
    }
    if (schemaToCompile[COMPILED] !== undefined) {
        return schemaToCompile;
    } // eslint-disable-line

    // console.log("compile schema", schemaToCompile.$id);

    const context: Context = { ids: {}, anchors: {}, remotes: draft.remotes };
    const rootSchemaAsString = JSON.stringify(schemaToCompile);
    const compiledSchema = JSON.parse(rootSchemaAsString);
    Object.defineProperties(compiledSchema, {
        [COMPILED]: { enumerable: false, value: true },
        [GET_CONTEXT]: { enumerable: false, value: () => context },
        [GET_REF]: {
            enumerable: false,
            value: getRef.bind(null, context, compiledSchema)
        }
    });

    // bail early, when no $refs are defined
    if (force === false && rootSchemaAsString.includes("$ref") === false) {
        return compiledSchema;
    }

    // compile this schema under rootSchema, making definitions available to $ref-resolution
    if (compiledSchema !== rootSchema) {
        Object.defineProperty(compiledSchema, "$defs", {
            enumerable: true,
            value: Object.assign(
                {},
                rootSchema.definitions,
                rootSchema.$defs,
                compiledSchema.definitions,
                compiledSchema.$defs
            )
        });
    }

    const scopes: Record<string, string> = {};
    const getRoot = () => compiledSchema;
    eachSchema(compiledSchema, (schema, pointer) => {
        if (schema.$id) {
            // if this is a schema being merged on root object, we cannot override
            // parents locations, but must reuse it
            if (schema.$id.startsWith("http") && /(allOf|anyOf|oneOf|if)\/\d+$/.test(pointer)) {
                const parentPointer = pointer.replace(/\/(allOf|anyOf|oneOf|if)\/\d+$/, "");
                const parentSchema = get(compiledSchema, parentPointer);
                schema.$id = parentSchema.$id ?? schema.$id;
            }
            context.ids[schema.$id.replace(suffixes, "")] = pointer;
        }

        // build up scopes and add them to $ref-resolution map
        pointer = `#${pointer}`.replace(/##+/, "#");
        const previousPointer = pointer.replace(/\/[^/]+$/, "");
        const parentPointer = pointer.replace(/\/[^/]+\/[^/]+$/, "");
        const previousScope = scopes[previousPointer] || scopes[parentPointer];
        const scope = joinScope(previousScope, schema.$id);
        // // @todo specify behaviour - we do not save ids with trailing slashes...
        scopes[pointer] = scope;
        if (context.ids[scope] == null) {
            context.ids[scope] = pointer;
        }

        if (schema.$anchor) {
            context.anchors[`${scope}#${schema.$anchor}`] = pointer;
        }

        if (schema.$ref && !schema[COMPILED_REF]) {
            Object.defineProperty(schema, COMPILED_REF, {
                enumerable: false,
                value: joinScope(scope, schema.$ref)
            });
            Object.defineProperty(schema, GET_ROOT, { enumerable: false, value: getRoot });
        }
    });

    // console.log("ids", context.ids);
    // console.log("anchors", context.anchors);

    return compiledSchema;
}
