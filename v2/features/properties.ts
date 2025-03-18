import { JsonError } from "../../lib/types";
import { SchemaNode } from "../types";
import { getValue } from "../utils/getValue";
import { JsonSchemaResolverParams, JsonSchemaValidatorParams } from "../types";
import { isObject } from "../../lib/utils/isObject";

propertyResolver.toJSON = () => "propertyResolver";
function propertyResolver({ node, key }: JsonSchemaResolverParams) {
    return node.properties?.[key];
}

export function parseProperties(node: SchemaNode) {
    const { schema, spointer, schemaId } = node;
    if (schema.properties) {
        node.properties = {};
        Object.keys(schema.properties).forEach((propertyName) => {
            const propertyNode = node.compileSchema(
                schema.properties[propertyName],
                `${spointer}/properties/${propertyName}`,
                `${schemaId}/properties/${propertyName}`
            );
            node.properties[propertyName] = propertyNode;
        });
        node.resolvers.push(propertyResolver);
    }
}

propertiesValidator.toJSON = () => "propertiesValidator";
export function propertiesValidator({ properties, validators }: SchemaNode) {
    if (properties) {
        // note: this expects PARSER to have compiled properties
        validators.push(validateProperties);
    }
}

validateProperties.toJSON = () => "properties";
function validateProperties({ node, data, pointer = "#", path }: JsonSchemaValidatorParams) {
    if (!isObject(data)) {
        return;
    }
    // move validation through properties
    const errors: JsonError[] = [];
    Object.keys(data).forEach((propertyName) => {
        if (node.properties[propertyName] == null) {
            return;
        }
        const propertyNode = node.properties[propertyName];
        const result = propertyNode.validate(getValue(data, propertyName), `${pointer}/${propertyName}`, path);
        errors.push(...result);
    });
    return errors;
}
