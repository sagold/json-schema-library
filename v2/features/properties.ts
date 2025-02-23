import { JsonError } from "../../lib/types";
import { SchemaNode } from "../compiler/types";
import { getValue } from "../utils/getValue";
import { JsonSchemaResolverParams, JsonSchemaValidatorParams } from "../compiler/types";
import { isObject } from "../../lib/utils/isObject";

propertyResolver.toJSON = () => "propertyResolver";
function propertyResolver({ node, key }: JsonSchemaResolverParams) {
    return node.properties[key];
}

export function parseProperties(node: SchemaNode) {
    const { draft, schema, spointer } = node;
    if (schema.properties) {
        node.properties = {};
        Object.keys(schema.properties).forEach((propertyName) => {
            const propertyNode = node.compileSchema(
                draft,
                schema.properties[propertyName],
                `${spointer}/properties/${propertyName}`,
                node
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
        validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
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
                const result = propertyNode.validate(getValue(data, propertyName), `${pointer}/${propertyName}`);
                errors.push(...result);
            });
            return errors;
        });
    }
}
