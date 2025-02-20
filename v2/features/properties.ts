import { JsonError } from "../../lib/types";
import { SchemaNode } from "../compiler/types";
import { getValue } from "../getValue";
import { JsonSchemaResolverParams, JsonSchemaValidatorParams } from "../compiler/types";

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
            // move validation through properties
            const errors: JsonError[] = [];
            Object.keys(node.properties).forEach((propertyName) => {
                const propertyNode = node.properties[propertyName];
                const result = propertyNode.validate(getValue(data, propertyName), `${pointer}/${propertyName}`);
                if (Array.isArray(result)) {
                    errors.push(...result);
                } else if (result) {
                    errors.push(result);
                }
            });
            return errors;
        });
    }
}
