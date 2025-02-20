import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaResolverParams, SchemaNode } from "../compiler/types";
import { getValue } from "../getValue";

additionalPropertyResolver.toJSON = () => "additionalPropertyResolver";
function additionalPropertyResolver({ node, data, key }: JsonSchemaResolverParams) {
    const value = getValue(data, key);
    if (node.additionalProperties) {
        return node.additionalProperties.reduce({ data: value });
    }
    const schema = node.draft.createSchemaOf(value);
    // undefined does not create a schema
    if (schema) {
        const temporaryNode = node.compileSchema(node.draft, schema, node.spointer, node);
        return temporaryNode;
    }
}

// must come as last resolver
export function parseAdditionalProperties(node: SchemaNode) {
    const { draft, schema, spointer } = node;
    if (schema.additionalProperties === false) {
        return;
    }
    if (isObject(schema.additionalProperties)) {
        node.additionalProperties = node.compileSchema(
            draft,
            schema.additionalProperties,
            `${spointer}/additionalProperties`,
            node
        );
    }
    node.resolvers.push(additionalPropertyResolver);
}
