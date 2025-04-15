import { isObject } from "../utils/isObject";
import { validateNode } from "../validateNode";
export const propertyNamesKeyword = {
    id: "propertyNames",
    keyword: "propertyNames",
    parse: parsePropertyNames,
    addValidate: ({ schema }) => schema.propertyNames != null,
    validate: validatePropertyNames
};
export function parsePropertyNames(node) {
    const { propertyNames } = node.schema;
    if (propertyNames == null) {
        return;
    }
    if (isObject(propertyNames)) {
        node.propertyNames = node.compileSchema(propertyNames, `${node.evaluationPath}/propertyNames`, `${node.schemaLocation}/propertyNames`);
    }
}
function validatePropertyNames({ node, data, pointer, path }) {
    const { schema } = node;
    if (!isObject(data)) {
        return undefined;
    }
    // bool schema
    if (schema.propertyNames === false) {
        // empty objects are valid
        if (Object.keys(data).length === 0) {
            return undefined;
        }
        return node.createError("invalid-property-name-error", {
            property: Object.keys(data),
            pointer,
            value: data,
            schema
        });
    }
    if (schema.propertyNames === true) {
        return undefined;
    }
    if (!isObject(node.propertyNames)) {
        // ignore invalid schema
        return undefined;
    }
    const errors = [];
    const properties = Object.keys(data);
    properties.forEach((prop) => {
        const validationResult = validateNode(node.propertyNames, prop, `${pointer}/prop`, path);
        if (validationResult.length > 0) {
            errors.push(node.createError("invalid-property-name-error", {
                property: prop,
                pointer,
                validationError: validationResult[0],
                value: data[prop],
                schema
            }));
        }
    });
    return errors;
}
