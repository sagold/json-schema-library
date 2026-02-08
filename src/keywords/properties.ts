import { getValue } from "../utils/getValue";
import { SchemaNode } from "../types";
import { Keyword, JsonSchemaResolverParams, JsonSchemaValidatorParams, ValidationResult } from "../Keyword";
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
    const errors: ValidationResult[] = [];
    const properties = node.properties ?? {};
    Object.keys(data).forEach((propertyName) => {
        if (properties[propertyName] == null) {
            return;
        }
        const propertyNode = properties[propertyName];
        const result = validateNode(propertyNode, getValue(data, propertyName), `${pointer}/${propertyName}`, path);
        errors.push(...result);
    });
    return errors;
}
