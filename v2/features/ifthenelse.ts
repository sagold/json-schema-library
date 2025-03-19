import { mergeSchema } from "../../lib/mergeSchema";
import { JsonSchemaReducerParams, SchemaNode } from "../types";

export function parseIfThenElse(node: SchemaNode) {
    const { schema, spointer } = node;
    if (schema.if != null) {
        node.if = node.compileSchema(schema.if, `${spointer}/if`);
    }
    if (schema.then != null) {
        node.then = node.compileSchema(schema.then, `${spointer}/then`);
    }
    if (schema.else != null) {
        node.else = node.compileSchema(schema.else, `${spointer}/else`);
    }

    if (node.if && (node.then != null || node.else != null)) {
        node.reducers.push(reduceIf);
    }
}

reduceIf.toJSON = () => "reduceIf";
function reduceIf({ node, data, pointer }: JsonSchemaReducerParams) {
    if (data === undefined) {
        return undefined;
    }

    if (node.if.validate(data, pointer).length === 0) {
        if (node.then) {
            // reduce creates a new node
            const schemaNode = node.then.reduce({ data });
            const schema = mergeSchema(node.then.schema, schemaNode.schema, "if", "then", "else");
            return node.compileSchema(schema, node.then.spointer);
        }
    } else if (node.else) {
        const schemaNode = node.else.reduce({ data });
        const schema = mergeSchema(node.else.schema, schemaNode.schema, "if", "then", "else");
        return node.compileSchema(schema, node.else.spointer);
    }
    return undefined;
}

export function ifThenElseValidator(node: SchemaNode) {
    if (node.if == null) {
        return;
    }
    node.validators.push(({ node, data, pointer, path }) => {
        if (node.if.validate(data, pointer, path).length === 0) {
            // console.log("if true");
            if (node.then) {
                return node.then.validate(data, pointer, path);
            }
        } else if (node.else) {
            // console.log("if false");
            return node.else.validate(data, pointer, path);
        }
        // console.log("fail through ifthenelse", node.if != null, node.then != null, node.else != null);
    });
}
