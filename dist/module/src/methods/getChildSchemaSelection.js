import { isSchemaNode } from "../types";
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
    if ((_a = node.itemsObject) === null || _a === void 0 ? void 0 : _a.oneOf) {
        return node.itemsObject.oneOf.map((childNode) => childNode.resolveRef());
    }
    // array.items[] found
    if (node.itemsList && node.itemsList.length > +property) {
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
    if (node.itemsObject) {
        // we fallback to a string if no schema is defined - might be subject for configuration
        return [node.itemsObject.resolveRef()];
    }
    // array.items[] exceeded
    if (node.itemsList && node.itemsList.length <= +property) {
        return [];
    }
    const { node: childNode, error } = node.getChild(property);
    return error !== null && error !== void 0 ? error : [childNode];
}
