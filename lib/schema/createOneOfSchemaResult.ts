import { JsonSchema } from "../types";

export function createOneOfSchemaResult(
    schema: JsonSchema,
    oneOfSchema: JsonSchema,
    oneOfIndex: number
) {
    const childSchema = { ...oneOfSchema };
    Object.defineProperty(childSchema, "getOneOfOrigin", {
        enumerable: false,
        value: () => ({
            index: oneOfIndex,
            schema
        })
    });
    return childSchema;
}
