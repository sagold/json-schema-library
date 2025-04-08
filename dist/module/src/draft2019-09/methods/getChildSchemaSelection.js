/**
 * Returns a list of possible child-schemas for the given property key. In case of a oneOf selection, multiple schemas
 * could be added at the given property (e.g. item-index), thus an array of options is returned. In all other cases
 * a list with a single item will be returned
 */
export function getChildSchemaSelection(node, property) {
    var _a;
    if (node.oneOf) {
        return node.oneOf.map((childNode) => childNode.resolveRef());
    }
    if ((_a = node.items) === null || _a === void 0 ? void 0 : _a.oneOf) {
        return node.items.oneOf.map((childNode) => childNode.resolveRef());
    }
    // array.items[] found
    if (node.prefixItems && node.prefixItems.length > +property) {
        const { node: childNode, error } = node.getChild(property);
        if (node) {
            return [childNode];
        }
        return error;
    }
    // array.items[] exceeded (or undefined), but additionalItems specified
    if (node.additionalItems && node.items == null) {
        // we fallback to a string if no schema is defined - might be subject for configuration
        // @ts-expect-error boolean schema
        if (node.additionalItems.schema === true) {
            return [node.compileSchema({ type: "string" })];
        }
        return [node.additionalItems.resolveRef()];
    }
    // array.items[] exceeded
    if (node.prefixItems && node.prefixItems.length <= +property) {
        return [];
    }
    const { node: childNode, error } = node.getChild(property);
    if (error) {
        return error;
    }
    return [childNode];
}
