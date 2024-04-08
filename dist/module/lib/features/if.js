import Q from "../Q";
/**
 * returns if-then-else as a json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns json schema defined by if-then-else or undefined
 */
export function resolveIfSchema(draft, schema, data) {
    if (schema.if == null) {
        return undefined;
    }
    if (schema.if === false) {
        return schema.else;
    }
    if (schema.if && (schema.then || schema.else)) {
        const ifErrors = draft.validate(data, Q.add(schema, draft.resolveRef(schema.if)));
        if (ifErrors.length === 0 && schema.then) {
            return draft.resolveRef(schema.then);
        }
        if (ifErrors.length !== 0 && schema.else) {
            return draft.resolveRef(schema.else);
        }
    }
}
/**
 * @returns validation result of it-then-else schema
 */
const validateIf = (draft, schema, value, pointer) => {
    const resolvedSchema = resolveIfSchema(draft, schema, value);
    if (resolvedSchema) {
        // @recursiveRef ok, we not just add per pointer, but any evlauation to dynamic scope / validation path
        const nextScope = Q.add(schema, resolvedSchema);
        return draft.validate(value, nextScope, pointer);
    }
};
export { validateIf };
