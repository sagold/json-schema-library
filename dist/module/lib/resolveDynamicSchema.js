import { isJsonError } from "./types";
import { isSchemaNode } from "./schemaNode";
import { mergeSchema } from "./mergeSchema";
import { resolveIfSchema } from "./features/if";
import { resolveDependencies } from "./features/dependencies";
import { mergeAllOfSchema } from "./features/allOf";
import { mergeValidAnyOfSchema } from "./features/anyOf";
import { resolveOneOfFuzzy as resolveOneOf } from "./features/oneOf";
import { omit } from "./utils/omit";
const toOmit = ["allOf", "anyOf", "oneOf", "dependencies", "if", "then", "else"];
const dynamicProperties = ["allOf", "anyOf", "oneOf", "dependencies", "if"];
export function isDynamicSchema(schema) {
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
export function resolveDynamicSchema(schemaNode, data) {
    let resolvedSchema;
    let error;
    const node = schemaNode.draft.resolveRef(schemaNode);
    const { draft } = node;
    const schema = isSchemaNode(node) ? node.schema : node;
    // @feature oneOf
    if (schema.oneOf) {
        const oneOfSchema = resolveOneOf(node, data);
        if (isJsonError(oneOfSchema)) {
            error = oneOfSchema;
        }
        else if (oneOfSchema) {
            resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, oneOfSchema.schema);
        }
    }
    // @feature allOf
    if (Array.isArray(schema.allOf)) {
        const allOf = schema.allOf.map((s) => {
            // before merging allOf schema we need to resolve all subschemas
            // if not, we would wrongly merge oneOf, if-then statements, etc
            if (isDynamicSchema(s)) {
                // copy of reduceSchema
                const result = resolveDynamicSchema(node.next(s), data);
                // note: result has no scope
                if (result == null || isJsonError(result)) {
                    return result;
                }
                const finalSchema = mergeSchema(s, result.schema);
                return omit(finalSchema, ...toOmit);
            }
            return s;
        });
        if (allOf.length > 0) {
            const allOfSchema = mergeAllOfSchema(draft, { allOf });
            resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, allOfSchema);
        }
    }
    // @feature anyOf
    const anyNode = mergeValidAnyOfSchema(node, data);
    if (anyNode && anyNode.schema) {
        resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, anyNode.schema);
    }
    // @feature dependencies
    const dependenciesSchema = resolveDependencies(node, data);
    if (dependenciesSchema) {
        resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, dependenciesSchema);
    }
    // @feature if-then-else
    const ifNodeResolved = resolveIfSchema(node, data);
    if (isSchemaNode(ifNodeResolved)) {
        resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, ifNodeResolved.schema);
    }
    if (resolvedSchema == null) {
        return error;
    }
    if (isJsonError(resolvedSchema)) {
        return resolvedSchema;
    }
    const nestedSchema = resolveDynamicSchema(node.next(resolvedSchema), data);
    if (isSchemaNode(nestedSchema)) {
        resolvedSchema = mergeSchema(resolvedSchema, nestedSchema.schema);
    }
    const finalSchema = omit(resolvedSchema, ...toOmit);
    return node.next(finalSchema);
}
