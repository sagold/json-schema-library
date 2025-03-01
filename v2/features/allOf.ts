import { mergeSchema } from "../../lib/mergeSchema";
import { JsonSchemaReducerParams, SchemaNode } from "../compiler/types";

export function parseAllOf(node: SchemaNode) {
    const { draft, schema, spointer } = node;
    if (Array.isArray(schema.allOf) && schema.allOf.length) {
        // @todo immediately compile if no resolvers are added
        node.allOf = schema.allOf.map((s, index) => node.compileSchema(draft, s, `${spointer}/allOf/${index}`));
        node.reducers.push(reduceAllOf);
    }
}

reduceAllOf.toJSON = () => "reduceAllOf";
function reduceAllOf({ node, data }: JsonSchemaReducerParams) {
    // note: parts of schemas could be merged, e.g. if they do not include
    // dynamic schema parts
    let mergedSchema = {};
    for (let i = 0; i < node.allOf.length; i += 1) {
        const schemaNode = node.allOf[i].reduce({ data });
        const schema = mergeSchema(node.allOf[i].schema, schemaNode.schema);
        mergedSchema = mergeSchema(mergedSchema, schema, "allOf");
    }
    return node.compileSchema(node.draft, mergedSchema, `${node.spointer}/allOf`);
}
