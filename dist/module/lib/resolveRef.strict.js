import { isSchemaNode } from "./schemaNode";
export default function resolveRef(node) {
    if (!isSchemaNode(node)) {
        throw new Error("schema node expected");
    }
    if (node.schema == null || node.schema.$ref == null) {
        return node;
    }
    if (node.schema.getRoot) {
        // we actually always need to resolve the schema like this, since returned subschemas
        // must resolve relative from their schema
        const resolvedSchema = node.schema.getRoot().getRef(node.schema);
        return node.next(resolvedSchema);
    }
    // tryout - this should never be called, except we missed something
    const resolvedSchema = node.draft.rootSchema.getRef(node.schema);
    return node.next(resolvedSchema);
}
