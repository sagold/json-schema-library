import { mergeSchema } from "./mergeSchema";
import { resolveIfSchema } from "./features/if";
import { resolveDependencies } from "./features/dependencies";
const toOmit = ["dependencies", "if", "then", "else"];
/**
 * reduces json schema by merging dynamic constructs like if-then-else,
 * dependencies, allOf, anyOf, oneOf, etc into a static json schema
 * omitting those properties.
 *
 * @returns reduced json schema
 */
export function reduceSchema(draft, schema, data) {
    let resolvedSchema = { ...schema };
    // @feature dependencies
    const dependenciesSchema = resolveDependencies(draft, schema, data);
    if (dependenciesSchema) {
        resolvedSchema = mergeSchema(resolvedSchema, reduceSchema(draft, dependenciesSchema, data));
    }
    // @feature if-then-else
    const ifSchema = resolveIfSchema(draft, schema, data);
    if (ifSchema) {
        resolvedSchema = mergeSchema(resolvedSchema, reduceSchema(draft, ifSchema, data));
    }
    const finalSchema = {};
    Object.keys(resolvedSchema).forEach((prop) => {
        if (!toOmit.includes(prop)) {
            finalSchema[prop] = resolvedSchema[prop];
        }
    });
    return finalSchema;
}
