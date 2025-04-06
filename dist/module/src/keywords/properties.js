import { getValue } from "../utils/getValue";
import { isObject } from "../utils/isObject";
import { validateNode } from "../validateNode";
export const propertiesKeyword = {
    id: "property",
    keyword: "properties",
    parse: parseProperties,
    addResolve: (node) => node.properties != null,
    resolve: propertyResolver,
    addValidate: (node) => node.properties != null,
    validate: validateProperties
};
function propertyResolver({ node, key }) {
    var _a;
    return (_a = node.properties) === null || _a === void 0 ? void 0 : _a[key];
}
export function parseProperties(node) {
    const { schema, spointer, schemaId } = node;
    if (schema.properties) {
        node.properties = {};
        Object.keys(schema.properties).forEach((propertyName) => {
            const propertyNode = node.compileSchema(schema.properties[propertyName], `${spointer}/properties/${propertyName}`, `${schemaId}/properties/${propertyName}`);
            node.properties[propertyName] = propertyNode;
        });
    }
}
function validateProperties({ node, data, pointer, path }) {
    if (!isObject(data)) {
        return;
    }
    // move validation through properties
    const errors = [];
    Object.keys(data).forEach((propertyName) => {
        if (node.properties[propertyName] == null) {
            return;
        }
        const propertyNode = node.properties[propertyName];
        const result = validateNode(propertyNode, getValue(data, propertyName), `${pointer}/${propertyName}`, path);
        errors.push(...result);
    });
    return errors;
}
