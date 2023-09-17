import { JsonError, JsonPointer, JsonSchema, isJsonError } from "./types";
import { Draft } from "./draft";
import { mergeSchema } from "./mergeSchema";
import { resolveIfSchema } from "./features/if";
import { resolveDependencies } from "./features/dependencies";
import { mergeAllOfSchema } from "./features/allOf";
import { mergeValidAnyOfSchema } from "./features/anyOf";
import { resolveOneOfFuzzy as resolveOneOf } from "./features/oneOf";
import { JsonData } from "@sagold/json-pointer";
import { omit } from "./utils/omit";

const toOmit = ["allOf", "anyOf", "oneOf", "dependencies", "if", "then", "else"];
const dynamicProperties = ["allOf", "anyOf", "oneOf", "dependencies", "if"];

export function isDynamicSchema(schema: JsonData): boolean {
    const givenProps = Object.keys(schema);
    return dynamicProperties.findIndex((prop) => givenProps.includes(prop)) !== -1;
}

/**
 * @note this utility does not reference draft methods for resolution
 * @todo consider using draft methods
 *
 * Resolves all dynamic schema definitions for the given input data and returns
 * the resulting json-schema without any dynamic schema definitions. The result
 * is not merged with the original input schema, thus static definitions of the
 * input schema are untouched and missing. For a full schema definition of this
 * input data you have to merge the result with the original schema
 * (@see reduceSchema)
 *
 * dynamic schema definitions: dependencies, allOf, anyOf, oneOf, if
 *
 * @returns static schema from resolved dynamic schema definitions for this
 *  specific input data
 */
export function resolveDynamicSchema(
    draft: Draft,
    schema: JsonSchema,
    data: unknown,
    pointer: JsonPointer
) {
    let resolvedSchema: JsonSchema;
    let error: JsonError;
    schema = draft.resolveRef(schema);

    // @feature oneOf
    if (schema.oneOf) {
        const oneOfSchema = resolveOneOf(draft, data, schema, pointer);
        if (isJsonError(oneOfSchema)) {
            error = oneOfSchema;
        } else if (oneOfSchema) {
            resolvedSchema = mergeSchema(resolvedSchema ?? {}, oneOfSchema);
        }
    }

    // @feature allOf
    if (Array.isArray(schema.allOf)) {
        const allOf = schema.allOf.map((s) => {
            // before merging allOf schema we need to resolve all subschemas
            // if not, we would wrongly merge oneOf, if-then statements, etc
            if (isDynamicSchema(s)) {
                // copy of reduceSchema
                let result = resolveDynamicSchema(draft, s, data, pointer);
                if (result) {
                    result = mergeSchema(s, result);
                    return omit(result, ...toOmit);
                }
                return undefined;
            }
            return s;
        });
        if (allOf.length > 0) {
            const allOfSchema = mergeAllOfSchema(draft, { allOf });
            resolvedSchema = mergeSchema(resolvedSchema ?? {}, allOfSchema);
        }
    }

    // @feature anyOf
    const anyOfSchema = mergeValidAnyOfSchema(draft, schema, data);
    if (anyOfSchema) {
        resolvedSchema = mergeSchema(resolvedSchema ?? {}, anyOfSchema);
    }

    // @feature dependencies
    const dependenciesSchema = resolveDependencies(draft, schema, data);
    if (dependenciesSchema) {
        resolvedSchema = mergeSchema(resolvedSchema ?? {}, dependenciesSchema);
    }

    // @feature if-then-else
    const ifSchema = resolveIfSchema(draft, schema, data);
    if (ifSchema) {
        resolvedSchema = mergeSchema(resolvedSchema ?? {}, ifSchema);
    }

    if (resolvedSchema == null) {
        return error;
    }

    const nestedSchema: JsonSchema | undefined = resolveDynamicSchema(
        draft,
        resolvedSchema,
        data,
        pointer
    );
    if (nestedSchema) {
        resolvedSchema = mergeSchema(resolvedSchema, nestedSchema);
    }

    return omit(resolvedSchema, ...toOmit);
}
