import { JsonSchema, JsonPointer } from "./types";
import { Draft } from "./draft";
import { mergeSchema } from "./mergeSchema";
import { resolveDynamicSchema } from "./resolveDynamicSchema";
import { omit } from "./utils/omit";

const toOmit = ["allOf", "anyOf", "oneOf", "dependencies", "if", "then", "else"];

/**
 * reduces json schema by merging dynamic constructs like if-then-else,
 * dependencies, allOf, anyOf, oneOf, etc into a static json schema
 * omitting those properties.
 *
 * @returns input schema reduced by dynamic schema definitions for the given
 * input data
 */
export function reduceSchema(
    draft: Draft,
    schema: JsonSchema,
    data: unknown,
    pointer: JsonPointer
) {
    let resolvedSchema = resolveDynamicSchema(draft, schema, data, pointer);
    if (resolvedSchema) {
        resolvedSchema = mergeSchema(schema, resolvedSchema);
        return omit(resolvedSchema, ...toOmit);
    }
    return schema;
}
