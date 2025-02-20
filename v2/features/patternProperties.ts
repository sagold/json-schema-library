import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaResolverParams, SchemaNode } from "../compiler/types";

patternPropertyResolver.toJSON = () => "patternPropertyResolver";
function patternPropertyResolver({ node, key }: JsonSchemaResolverParams) {
    return node.patternProperties.find(({ pattern }) => pattern.test(`${key}`))?.node;
}

export function parsePatternProperties(node: SchemaNode) {
    const { draft, schema } = node;
    if (!isObject(schema.patternProperties)) {
        return;
    }
    const patterns = Object.keys(schema.patternProperties);
    if (patterns.length === 0) {
        return;
    }
    node.patternProperties = [];
    patterns.map((pattern) =>
        node.patternProperties.push({
            pattern: new RegExp(pattern),
            node: node.compileSchema(
                draft,
                schema.patternProperties[pattern],
                `${node.spointer}/patternProperties/${pattern}`,
                node
            )
        })
    );
    node.resolvers.push(patternPropertyResolver);
}
