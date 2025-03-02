import { mergeSchema } from "../../lib/mergeSchema";
import { JsonSchemaReducerParams, SchemaNode } from "../compiler/types";

export function parseIfThenElse(node: SchemaNode) {
    const { draft, schema, spointer } = node;
    if (schema.if != null) {
        node.if = node.compileSchema(draft, schema.if, `${spointer}/if`);
    }
    if (schema.then != null) {
        node.then = node.compileSchema(draft, schema.then, `${spointer}/then`);
    }
    if (schema.else != null) {
        node.compileSchema(draft, schema.else, `${spointer}/else`);
    }

    if (node.if && (node.then != null || node.else != null)) {
        node.reducers.push(reduceIf);
    }
}

reduceIf.toJSON = () => "reduceIf";
function reduceIf({ node, data, pointer }: JsonSchemaReducerParams) {
    if (node.if.validate(data, pointer).length === 0) {
        if (node.then) {
            // reduce creates a new node
            const schemaNode = node.then.reduce({ data });
            const schema = mergeSchema(node.then.schema, schemaNode.schema, "if", "then", "else");
            return node.compileSchema(node.draft, schema, node.then.spointer);
        }
    } else if (node.else) {
        const schemaNode = node.else.reduce({ data });
        const schema = mergeSchema(node.else.schema, schemaNode.schema, "if", "then", "else");
        return node.compileSchema(node.draft, schema, node.else.spointer);
    }
    return undefined;
}

export function ifThenElseValidator(node: SchemaNode) {
    if (node.if == null) {
        return;
    }
    node.validators.push(({ node, data, pointer }) => {
        if (node.if.validate(data, pointer).length === 0) {
            if (node.then) {
                return node.then.validate(data, pointer);
            }
        } else if (node.else) {
            return node.else.validate(data, pointer);
        }
    });
}
