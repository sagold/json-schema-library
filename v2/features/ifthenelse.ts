import { mergeSchema } from "../../lib/mergeSchema";
import { JsonSchemaReducerParams, SchemaNode } from "../compiler/types";

reduceIf.toJSON = () => "reduceIf";
function reduceIf({ node, data }: JsonSchemaReducerParams) {
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

export function parseIfThenElse(node: SchemaNode) {
    const { draft, schema, spointer } = node;
    if (schema.if && (schema.then || schema.else)) {
        node.if = node.compileSchema(draft, schema.if, `${spointer}/if`, node);
        node.then = schema.then ? node.compileSchema(draft, schema.then, `${spointer}/then`, node) : undefined;
        node.else = schema.else ? node.compileSchema(draft, schema.else, `${spointer}/else`, node) : undefined;
        node.reducers.push(reduceIf);
    }
}
