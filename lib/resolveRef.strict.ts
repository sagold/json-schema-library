import { JSONSchema } from "./types";


export default function resolveRef(schema: JSONSchema, rootSchema: JSONSchema): JSONSchema {
    if (schema == null || schema.$ref == null) {
        return schema;
    }

    const resolvedSchema = rootSchema.getRef(schema);
    return resolvedSchema;
}
