import { JsonSchema } from "./types";
import { SchemaNode, isSchemaNode } from "./schemaNode";

// 1. https://json-schema.org/draft/2019-09/json-schema-core#scopes
function resolveRecursiveRef(node: SchemaNode): SchemaNode {
    const history = node.path;
    // console.log(...history);

    // RESTRICT BY CHANGE IN BASE-URL
    let startIndex = 0;
    for (let i = history.length - 1; i >= 0; i--) {
        const step = history[i][1];
        if (step.$id && /^https?:\/\//.test(step.$id) && step.$recursiveAnchor !== true) {
            startIndex = i;
            break;
        }
    }
    // FROM THERE FIND FIRST OCCURENCE OF ANCHOR
    const firstAnchor = history.find((s, index) => index >= startIndex && s[1].$recursiveAnchor === true);
    if (firstAnchor) {
        return node.next(firstAnchor[1]);
    }
    // THEN RETURN LATEST BASE AS TARGET
    for (let i = history.length - 1; i >= 0; i--) {
        const step = history[i][1];
        if (step.$id) {
            return node.next(step);
        }
    }
    // OR RETURN ROOT
    return node.next(node.draft.rootSchema);
}

/**
 * @todo update types
 * Note: JsonSchema my be false
 */
export default function resolveRef(node: SchemaNode): SchemaNode {
    if (!isSchemaNode(node)) {
        throw new Error("expected node");
    }
    if (node.schema == null) {
        return node;
    }
    if (node.schema.$recursiveRef) {
        return resolveRef(resolveRecursiveRef(node));
    }
    if (node.schema.$ref == null) {
        return node;
    }
    const resolvedSchema = node.draft.rootSchema.getRef(node.schema);
    if (resolvedSchema === false) {
        return node.next(resolvedSchema as JsonSchema);
    }
    // @draft >= 2019-09 we now merge schemas: in draft <= 7 $ref is treated as reference, not as schema
    return node.merge(resolvedSchema, "$ref");
}
