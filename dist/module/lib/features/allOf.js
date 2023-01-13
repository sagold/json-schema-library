import { mergeSchema } from "../mergeSchema";
/**
 * returns allOf as a json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns json schema defined by allOf or undefined
 */
export function resolveAllOfSchema(draft, schema, data) {
    const { allOf } = schema;
    if (!Array.isArray(allOf) || allOf.length === 0) {
        return;
    }
    let resolvedSchema = {};
    allOf.forEach((subschema) => {
        resolvedSchema = mergeSchema(resolvedSchema, subschema);
    });
    resolvedSchema.type = resolvedSchema.type || schema.type;
    return resolvedSchema;
}
const validateAllOf = (core, schema, value, pointer) => {
    const { allOf } = schema;
    if (!Array.isArray(allOf) || allOf.length === 0) {
        return;
    }
    const errors = [];
    schema.allOf.forEach((subSchema) => {
        errors.push(...core.validate(value, subSchema, pointer));
    });
    return errors;
};
export { validateAllOf };
