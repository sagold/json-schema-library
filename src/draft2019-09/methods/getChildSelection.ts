import { JsonError, SchemaNode } from "../../types";

/**
 * Returns a list of possible child-schemas for the given property key. In case of a oneOf selection, multiple schemas
 * could be added at the given property (e.g. item-index), thus an array of options is returned. In all other cases
 * a list with a single item will be returned
 */
export function getChildSelection(node: SchemaNode, property: string | number): SchemaNode[] | JsonError {
    if (node.oneOf) {
        return node.oneOf.map((childNode: SchemaNode) => childNode.resolveRef());
    }
    if (node.items?.oneOf) {
        return node.items.oneOf.map((childNode: SchemaNode) => childNode.resolveRef());
    }

    // array.items[] found
    if (node.prefixItems && node.prefixItems.length > +property) {
        const { node: childNode, error } = node.getNodeChild(property);
        if (node) {
            return [childNode];
        }
        return error;
    }

    // array.items[] exceeded (or undefined), but additionalItems specified
    if (node.schema.additionalItems) {
        // we fallback to a string if no schema is defined - might be subject for configuration
        if (node.schema.additionalItems === true) {
            return [node.compileSchema({ type: "string" })];
        }
        return [node.items.resolveRef()];
    }

    // array.items[] exceeded
    if (node.prefixItems && node.prefixItems.length <= +property) {
        return [];
    }

    const { node: childNode, error } = node.getNodeChild(property);
    if (error) {
        return error;
    }

    return [childNode];
}
