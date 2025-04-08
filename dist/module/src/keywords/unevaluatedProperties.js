import { isSchemaNode } from "../types";
import { isObject } from "../utils/isObject";
import { getValue } from "../utils/getValue";
import { validateNode } from "../validateNode";
export const unevaluatedPropertiesKeyword = {
    id: "unevaluatedProperties",
    keyword: "unevaluatedProperties",
    parse: parseUnevaluatedProperties,
    addValidate: ({ schema }) => schema.unevaluatedProperties != null,
    validate: validateUnevaluatedProperties
};
export function parseUnevaluatedProperties(node) {
    if (!isObject(node.schema.unevaluatedProperties)) {
        return;
    }
    node.unevaluatedProperties = node.compileSchema(node.schema.unevaluatedProperties, `${node.spointer}/unevaluatedProperties`, `${node.schemaId}/unevaluatedProperties`);
}
function validateUnevaluatedProperties({ node, data, pointer, path }) {
    // if not in properties, evaluated by additionalProperties and not matches patternProperties
    // @todo we need to know dynamic parent statements - they should not be counted as evaluated...
    if (!isObject(data)) {
        return undefined;
    }
    // this will break?
    let { node: reducedNode } = node.reduce(data, { pointer, path });
    reducedNode = isSchemaNode(reducedNode) ? reducedNode : node;
    if (reducedNode.schema.unevaluatedProperties === true || reducedNode.schema.additionalProperties === true) {
        return undefined;
    }
    const unevaluated = Object.keys(data);
    if (unevaluated.length === 0) {
        return undefined;
    }
    const errors = [];
    for (let i = 0; i < unevaluated.length; i += 1) {
        const propertyName = unevaluated[i];
        const { node: child } = node.getChild(propertyName, data, { path });
        if (child) {
            if (validateNode(child, data[propertyName], `${pointer}/${propertyName}`, path).length > 0) {
                errors.push(node.createError("UnevaluatedPropertyError", {
                    pointer: `${pointer}/${propertyName}`,
                    value: JSON.stringify(data[propertyName]),
                    schema: node.schema
                }));
                continue;
            }
        }
        if (child === undefined) {
            if (node.if && isPropertyEvaluated(node.if, propertyName, data)) {
                // skip
            }
            else if (reducedNode.unevaluatedProperties) {
                const validationResult = validateNode(node.unevaluatedProperties, data[propertyName], `${pointer}/${propertyName}`, path);
                errors.push(...validationResult);
            }
            else if (reducedNode.schema.unevaluatedProperties === false) {
                errors.push(node.createError("UnevaluatedPropertyError", {
                    pointer: `${pointer}/${propertyName}`,
                    value: JSON.stringify(data[propertyName]),
                    schema: node.schema
                }));
            }
        }
    }
    return errors;
}
/** tests if a property is evaluated by the given schema */
function isPropertyEvaluated(schemaNode, propertyName, data) {
    const { node, error } = schemaNode.getChild(propertyName, data);
    if (node == null || error) {
        return false;
    }
    return node.validate(getValue(data, propertyName)).valid;
}
