import { JSONSchema } from "./types";
import { Draft } from "./draft";
import { mergeSchema } from "./mergeSchema";
import { resolveIfSchema } from "./features/if";
import { resolveDependencies } from "./features/dependencies";
import { resolveAllOfSchema } from "./features/allOf";
import { resolveOneOfFuzzy as resolveOneOf } from "./features/oneOf";
import { JsonData } from "@sagold/json-pointer";

const toOmit = ["allOf", "oneOf", "dependencies", "if", "then", "else"];
const dynamicProperties = ["allOf", "oneOf", "anyOf", "dependencies", "if"];

function omit(object: Record<string, unknown>, ...keysToOmit: string[]) {
    const result: Record<string, unknown> = {};
    Object.keys(object).forEach((key) => {
        if (!keysToOmit.includes(key)) {
            result[key] = object[key];
        }
    });
    if (object.getOneOfOrigin) {
        Object.defineProperty(result, "getOneOfOrigin", {
            enumerable: false,
            value: object.getOneOfOrigin
        });
    }
    return result;
}

export function isDynamicSchema(schema: JsonData): boolean {
    const givenProps = Object.keys(schema);
    return dynamicProperties.findIndex((prop) => givenProps.includes(prop)) !== -1;
}

export function resolveDynamicSchema(draft: Draft, schema: JSONSchema, data: unknown) {
    let resolvedSchema: JSONSchema;
    schema = draft.resolveRef(schema);

    // @feature oneOf
    if (schema.oneOf) {
        const oneOfSchema = resolveOneOf(draft, data, schema);
        if (oneOfSchema && oneOfSchema.type !== "error") {
            resolvedSchema = mergeSchema(resolvedSchema ?? {}, oneOfSchema);
        }
    }

    // @feature allOf
    const allOfSchema = resolveAllOfSchema(draft, schema, data);
    if (allOfSchema) {
        resolvedSchema = mergeSchema(resolvedSchema ?? {}, allOfSchema);
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
        return;
    }

    const nestedSchema: JSONSchema | undefined = resolveDynamicSchema(draft, resolvedSchema, data);
    if (nestedSchema) {
        resolvedSchema = mergeSchema(resolvedSchema, nestedSchema);
    }

    return omit(resolvedSchema, ...toOmit);
}

/**
 * reduces json schema by merging dynamic constructs like if-then-else,
 * dependencies, allOf, anyOf, oneOf, etc into a static json schema
 * omitting those properties.
 *
 * @returns reduced json schema
 */
export function reduceSchema(draft: Draft, schema: JSONSchema, data: unknown) {
    let resolvedSchema = resolveDynamicSchema(draft, schema, data);
    if (resolvedSchema) {
        resolvedSchema = mergeSchema(schema, resolvedSchema);
        return omit(resolvedSchema, ...toOmit);
    }
    return schema;
}
