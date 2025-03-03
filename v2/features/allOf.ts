import { mergeSchema } from "../../lib/mergeSchema";
import { JsonError } from "../../lib/types";
import { JsonSchemaReducerParams, SchemaNode } from "../compiler/types";

export function parseAllOf(node: SchemaNode) {
    const { schema, spointer } = node;
    if (Array.isArray(schema.allOf) && schema.allOf.length) {
        // @todo immediately compile if no resolvers are added
        node.allOf = schema.allOf.map((s, index) => node.compileSchema(s, `${spointer}/allOf/${index}`));
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
    return node.compileSchema(mergedSchema, `${node.spointer}/allOf`);
}

export function allOfValidator(node: SchemaNode) {
    if (node.allOf == null) {
        return;
    }
    node.validators.push(({ node, data, pointer }) => {
        if (!Array.isArray(node.allOf) || node.allOf.length === 0) {
            return;
        }
        const errors: JsonError[] = [];
        node.allOf.forEach((allOfNode) => {
            errors.push(...allOfNode.validate(data, pointer));
        });
        return errors;
    });
}
