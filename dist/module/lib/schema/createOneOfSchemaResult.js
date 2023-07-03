export function createOneOfSchemaResult(schema, oneOfSchema, oneOfIndex) {
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
