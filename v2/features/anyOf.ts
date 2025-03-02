import { mergeSchema } from "../../lib/mergeSchema";
import { JsonSchemaReducerParams, SchemaNode } from "../compiler/types";

export function parseAnyOf(node: SchemaNode) {
    const { draft, schema, spointer } = node;
    if (Array.isArray(schema.anyOf) && schema.anyOf.length) {
        // @todo immediately compile if no resolvers are added
        node.anyOf = schema.anyOf.map((s, index) => node.compileSchema(draft, s, `${spointer}/anyOf/${index}`));
        node.reducers.push(reduceAnyOf);
    }
}

reduceAnyOf.toJSON = () => "reduceAnyOf";
function reduceAnyOf({ node, data }: JsonSchemaReducerParams) {
    let mergedSchema = {};
    for (let i = 0; i < node.anyOf.length; i += 1) {
        if (node.anyOf[i].validate(data).length === 0) {
            const schemaNode = node.anyOf[i].reduce({ data });
            const schema = mergeSchema(node.anyOf[i].schema, schemaNode.schema);
            mergedSchema = mergeSchema(mergedSchema, schema, "anyOf");
        }
    }
    return node.compileSchema(node.draft, mergedSchema, `${node.spointer}/anyOf`);
}

export function anyOfValidator(node: SchemaNode) {
    if (node.anyOf == null || node.anyOf.length === 0) {
        return;
    }
    node.validators.push(({ node, data, pointer }) => {
        for (let i = 0; i < node.anyOf.length; i += 1) {
            if (node.anyOf[i].validate(data, pointer).length === 0) {
                return undefined;
            }
        }
        return node.draft.errors.anyOfError({ pointer, schema: node.schema, value: data, anyOf: node.schema.anyOf });
    });
}
