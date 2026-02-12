import { getValue } from "../utils/getValue";
import { SchemaNode } from "../types";
import { Keyword, JsonSchemaResolverParams, JsonSchemaValidatorParams, ValidationReturnType } from "../Keyword";
import { isObject } from "../utils/isObject";
import { validateNode } from "../validateNode";

export const propertiesKeyword: Keyword = {
    id: "property",
    keyword: "properties",
    parse: parseProperties,
    addResolve: (node: SchemaNode) => node.properties != null,
    resolve: propertyResolver,
    addValidate: (node: SchemaNode) => node.properties != null,
    validate: validateProperties
};

function propertyResolver({ node, key }: JsonSchemaResolverParams) {
    return node.properties?.[key];
}

export function parseProperties(node: SchemaNode) {
    const { schema, evaluationPath, schemaLocation } = node;
    if (schema.properties) {
        const parsedProperties: Record<string, SchemaNode> = {};
        Object.keys(schema.properties).forEach((propertyName) => {
            const propertyNode = node.compileSchema(
                schema.properties[propertyName],
                `${evaluationPath}/properties/${propertyName}`,
                `${schemaLocation}/properties/${propertyName}`
            );
            parsedProperties[propertyName] = propertyNode;
        });
        node.properties = parsedProperties;
    }
}

function validateProperties({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    if (!isObject(data)) {
        return;
    }
    // move validation through properties
    const errors: ValidationReturnType = [];
    const properties = node.properties ?? {};
    Object.keys(data).forEach((propertyName) => {
        const value = getValue(data, propertyName);
        const propertyNode = properties[propertyName];

        if (propertyNode == null || value === void 0) {
            return;
        }

        const result = validateNode(propertyNode, value, `${pointer}/${propertyName}`, path);
        errors.push(...result);
    });
    return errors;
}
