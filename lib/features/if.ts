/* draft-07 */
import { JSONSchema, JSONValidator } from "../types";
import { Draft } from "../draft";

/**
 * @returns json schema defined by if-then-else or undefined
 */
export function resolveIfSchema(
    draft: Draft,
    schema: JSONSchema,
    data: unknown
): JSONSchema | undefined {
    if (schema.if === false) {
        return schema.else;
    }
    if (schema.if && (schema.then || schema.else)) {
        const ifErrors = draft.validate(data, schema.if);
        if (ifErrors.length === 0 && schema.then) {
            return draft.resolveRef(schema.then);
        }
        if (ifErrors.length !== 0 && schema.else) {
            return draft.resolveRef(schema.else);
        }
    }
}

/**
 * @returns steps into if-then-else or returns undefined if not possible
 */
export function stepIntoIf(
    draft: Draft,
    key: string,
    schema: JSONSchema,
    data: unknown,
    pointer: string
): JSONSchema | undefined {
    if (schema.if && (schema.then || schema.else)) {
        const ifThenElseSchema = resolveIfSchema(draft, schema, data);
        const resolvedIfThenElseSchema = draft.step(key, ifThenElseSchema, data, pointer);
        if (
            typeof resolvedIfThenElseSchema.type === "string" &&
            resolvedIfThenElseSchema.type !== "error"
        ) {
            return resolvedIfThenElseSchema;
        }
    }
}

/**
 * @returns validation result of it-then-else schema
 */
const validateIf: JSONValidator = (draft, schema, value, pointer) => {
    const ifSchema = resolveIfSchema(draft, schema, value);
    if (ifSchema) {
        return draft.validate(value, ifSchema, pointer);
    }
};

export { validateIf };
