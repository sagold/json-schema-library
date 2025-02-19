// reducers must not work on `this` (array)
import { mergeSchema } from "../../mergeSchema";
// import { JsonSchema } from "../../types";
import { JsonSchemaReducerParams } from "./types";

reduceAllOf.toJSON = () => "reduceAllOf";
export function reduceAllOf({ node, data }: JsonSchemaReducerParams) {
    // note: parts of schemas could be merged, e.g. if they do not include
    // dynamic schema parts
    let mergedSchema = {};
    for (let i = 0; i < node.allOf.length; i += 1) {
        const schemaNode = node.allOf[i].reduce({ data });
        const schema = mergeSchema(node.allOf[i].schema, schemaNode.schema);
        mergedSchema = mergeSchema(mergedSchema, schema, "allOf");
    }
    return node.compileSchema(node.draft, mergedSchema, `${node.spointer}/allOf`, node);
}

reduceIf.toJSON = () => "reduceIf";
export function reduceIf({ node, data }: JsonSchemaReducerParams) {
    if (node.draft.isValid(data, node.if.schema)) {
        if (node.then) {
            // reduce creates a new node
            const schemaNode = node.then.reduce({ data });
            const schema = mergeSchema(node.then.schema, schemaNode.schema, "if", "then", "else");
            return node.compileSchema(node.draft, schema, node.then.spointer, node);
        }
    } else if (node.else) {
        const schemaNode = node.else.reduce({ data });
        const schema = mergeSchema(node.else.schema, schemaNode.schema, "if", "then", "else");
        return node.compileSchema(node.draft, schema, node.else.spointer, node);
    }
    return undefined;
}
