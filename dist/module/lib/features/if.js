/**
 * returns if-then-else as a json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns json schema defined by if-then-else or undefined
 */
export function resolveIfSchema(draft, schema, data) {
    if (schema.if === false) {
        return schema.else;
    }
    if (schema.if && (schema.then || schema.else)) {
        const ifErrors = draft.validate(data, draft.resolveRef(schema.if));
        if (ifErrors.length === 0 && schema.then) {
            return draft.resolveRef(schema.then);
        }
        if (ifErrors.length !== 0 && schema.else) {
            return draft.resolveRef(schema.else);
        }
    }
}
/**
 * steps into if-then-else
 * @returns json schema or undefined if 'key' is not defined
 */
// export function stepIntoIf(
//     draft: Draft,
//     key: string,
//     schema: JsonSchema,
//     data: unknown,
//     pointer: string
// ): JsonSchema | undefined {
//     if (schema.if && (schema.then || schema.else)) {
//         const resolvedSchema = resolveIfSchema(draft, schema, data);
//         if (resolvedSchema == null) {
//             return;
//         }
//         // @todo merge with schema before stepping? Note that validation must be separately
//         const resolvedIfThenElseSchema = draft.step(key, resolvedSchema, data, pointer);
//         if (
//             typeof resolvedIfThenElseSchema.type === "string" &&
//             resolvedIfThenElseSchema.type !== "error"
//         ) {
//             return resolvedIfThenElseSchema;
//         }
//     }
// }
/**
 * @returns validation result of it-then-else schema
 */
const validateIf = (draft, schema, value, pointer) => {
    const resolvedSchema = resolveIfSchema(draft, schema, value);
    if (resolvedSchema) {
        return draft.validate(value, resolvedSchema, pointer);
    }
};
export { validateIf };
