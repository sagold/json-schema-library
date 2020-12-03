export default function resolveRef(schema, rootSchema) {
    if (schema == null || schema.$ref == null) {
        return schema;
    }
    const resolvedSchema = rootSchema.getRef(schema);
    return resolvedSchema;
}
