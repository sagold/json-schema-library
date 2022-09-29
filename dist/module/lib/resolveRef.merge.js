export default function resolveRefMerge(schema, rootSchema) {
    if (schema == null || schema.$ref == null) {
        return schema;
    }
    const resolvedSchema = rootSchema.getRef(schema);
    const mergedSchema = Object.assign({}, resolvedSchema, schema);
    delete mergedSchema.$ref;
    // @todo the following might not be safe nor incomplete
    Object.defineProperty(mergedSchema, "__ref", { enumerable: false, value: schema.__ref });
    Object.defineProperty(mergedSchema, "getRoot", { enumerable: false, value: schema.getRoot });
    return mergedSchema;
}
