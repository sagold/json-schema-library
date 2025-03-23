import { mergeSchema } from "../../lib/mergeSchema";
import { Feature, JsonSchemaReducerParams, JsonSchemaValidatorParams, SchemaNode } from "../types";

export const anyOfFeature: Feature = {
    id: "anyOf",
    keyword: "anyOf",
    parse: parseAnyOf,
    addReduce: (node) => node.anyOf != null,
    reduce: reduceAnyOf,
    addValidate: (node) => node.anyOf != null,
    validate: validateAnyOf
};

export function parseAnyOf(node: SchemaNode) {
    const { schema, spointer, schemaId } = node;
    if (Array.isArray(schema.anyOf) && schema.anyOf.length) {
        node.anyOf = schema.anyOf.map((s, index) =>
            node.compileSchema(s, `${spointer}/anyOf/${index}`, `${schemaId}/anyOf/${index}`)
        );
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
    return node.compileSchema(mergedSchema, `${node.spointer}/anyOf`, node.schemaId);
}

function validateAnyOf({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    for (let i = 0; i < node.anyOf.length; i += 1) {
        if (node.anyOf[i].validate(data, pointer, path).length === 0) {
            return undefined;
        }
    }
    return node.errors.anyOfError({ pointer, schema: node.schema, value: data, anyOf: node.schema.anyOf });
}
