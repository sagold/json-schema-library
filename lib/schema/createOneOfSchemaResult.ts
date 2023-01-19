import { JSONSchema } from "../types";

export function createOneOfSchemaResult(
    schema: JSONSchema,
    oneOfSchema: JSONSchema,
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
