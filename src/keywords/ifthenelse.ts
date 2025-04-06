import { mergeSchema } from "../utils/mergeSchema";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams } from "../Keyword";
import { SchemaNode } from "../types";
import { validateNode } from "../validateNode";

export const ifKeyword: Keyword = {
    id: "if-then-else",
    keyword: "if",
    parse: parseIfThenElse,
    addReduce: (node: SchemaNode) => node.if && (node.then != null || node.else != null),
    reduce: reduceIf,
    addValidate: (node) => node.if != null,
    validate: validateIfThenElse
};

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
}

function reduceIf({ node, data, pointer, path }: JsonSchemaReducerParams) {
    if (data === undefined) {
        return undefined;
    }

    if (validateNode(node.if, data, pointer, [...(path ?? [])]).length === 0) {
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

function validateIfThenElse({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    if (validateNode(node.if, data, pointer, [...(path ?? [])]).length === 0) {
        if (node.then) {
            return validateNode(node.then, data, pointer, path);
        }
    } else if (node.else) {
        return validateNode(node.else, data, pointer, path);
    }
}
