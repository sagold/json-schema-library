import { mergeSchema } from "./mergeSchema";
import { resolveIfSchema } from "./features/if";
import { resolveDependencies } from "./features/dependencies";
import { resolveAllOfSchema } from "./features/allOf";
import resolveOneOf from "./resolveOneOf.fuzzy";
const toOmit = ["allOf", "oneOf", "dependencies", "if", "then", "else"];
const dynamicProperties = ["allOf", "oneOf", "anyOf", "dependencies", "if"];
export function isDynamicSchema(schema) {
    const givenProps = Object.keys(schema);
    return dynamicProperties.findIndex((prop) => givenProps.includes(prop)) !== -1;
}
export function resolveDynamicSchema(draft, schema, data) {
    var _a;
    let resolvedSchema;
    schema = draft.resolveRef(schema);
    // @feature oneOf
    if (schema.oneOf) {
        const oneOfSchema = resolveOneOf(draft, data, schema);
        if (oneOfSchema && oneOfSchema.type !== "error") {
            resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, oneOfSchema);
        }
    }
    if ((_a = schema.items) === null || _a === void 0 ? void 0 : _a.oneOf) {
        const oneOfSchema = resolveOneOf(draft, data, schema.items);
        if (oneOfSchema && oneOfSchema.type !== "error") {
            resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, oneOfSchema);
        }
    }
    // @feature allOf
    const allOfSchema = resolveAllOfSchema(draft, schema, data);
    if (allOfSchema) {
        resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, allOfSchema);
    }
    // @feature dependencies
    const dependenciesSchema = resolveDependencies(draft, schema, data);
    if (dependenciesSchema) {
        resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, dependenciesSchema);
    }
    // @feature if-then-else
    const ifSchema = resolveIfSchema(draft, schema, data);
    if (ifSchema) {
        resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, ifSchema);
    }
    if (resolvedSchema == null) {
        return;
    }
    const nestedSchema = resolveDynamicSchema(draft, resolvedSchema, data);
    if (nestedSchema) {
        resolvedSchema = mergeSchema(resolvedSchema, nestedSchema);
    }
    const finalSchema = {};
    Object.keys(resolvedSchema).forEach((prop) => {
        if (!toOmit.includes(prop)) {
            finalSchema[prop] = resolvedSchema[prop];
        }
    });
    return finalSchema;
}
/**
 * reduces json schema by merging dynamic constructs like if-then-else,
 * dependencies, allOf, anyOf, oneOf, etc into a static json schema
 * omitting those properties.
 *
 * @returns reduced json schema
 */
export function reduceSchema(draft, schema, data) {
    const resolvedSchema = resolveDynamicSchema(draft, schema, data);
    if (resolvedSchema) {
        return mergeSchema(schema, resolvedSchema);
    }
    return schema;
}
