import { isSchemaNode, JsonError, SchemaNode } from "../types";

/**
 * Returns a list of possible child-schemas for the given property key. In case of a oneOf selection, multiple schemas
 * could be added at the given property (e.g. item-index), thus an array of options is returned. In all other cases
 * a list with a single item will be returned
 */
export function getChildSchemaSelection(node: SchemaNode, property: string | number): SchemaNode[] | JsonError {
    if (node.oneOf) {
        return node.oneOf.map((childNode: SchemaNode) => childNode.resolveRef());
    }
    if (node.items?.oneOf) {
        return node.items.oneOf.map((childNode: SchemaNode) => childNode.resolveRef());
    }
    // array.items[] found
    if (node.prefixItems && node.prefixItems.length > +property) {
        const { node: childNode, error } = node.getChild(property);
        if (isSchemaNode(childNode)) {
            return [childNode];
        }
        return error;
    }
    if (node.schema.items === true) {
        return [node.compileSchema({ type: "string" })];
    }
    if (node.schema.items === false) {
        return [];
    }
    // array.items[] exceeded (or undefined), but additionalItems specified
    if (node.items) {
        // we fallback to a string if no schema is defined - might be subject for configuration
        return [node.items.resolveRef()];
    }
    // array.items[] exceeded
    if (node.prefixItems && node.prefixItems.length <= +property) {
        return [];
    }

    const { node: childNode, error } = node.getChild(property);
    return error ?? [childNode];
}
