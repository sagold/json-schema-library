import { mergeReducedNode } from "../mergeNode";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams, ValidationAnnotation } from "../Keyword";
import { isBooleanSchema, isJsonSchema, SchemaNode } from "../types";
import { validateNode } from "../validateNode";
import { collectValidationErrors } from "src/utils/collectValidationErrors";

export const ifKeyword: Keyword = {
    id: "if-then-else",
    keyword: "if",
    parse: parseIfThenElse,
    addReduce: (node: SchemaNode) => node.if != null && (node.then != null || node.else != null),
    reduce: reduceIf,
    addValidate: (node) => node.if != null,
    validate: validateIfThenElse
};

export function parseIfThenElse(node: SchemaNode) {
    const { schema, evaluationPath } = node;
    const errors: ValidationAnnotation[] = [];
    if (schema.if != null) {
        if (isJsonSchema(schema.if) || isBooleanSchema(schema.if)) {
            node.if = node.compileSchema(schema.if, `${evaluationPath}/if`);
            collectValidationErrors(errors, node.if);
        } else {
            errors.push(
                node.createError("schema-error", {
                    pointer: `${node.schemaLocation}/if`,
                    schema: node.schema,
                    value: schema.if,
                    message: `Keyword 'if' must be valid JSON Schema - received '${typeof schema.if}'`
                })
            );
        }
    }
    if (schema.then != null) {
        if (isJsonSchema(schema.then) || isBooleanSchema(schema.then)) {
            node.then = node.compileSchema(schema.then, `${evaluationPath}/then`);
            collectValidationErrors(errors, node.then);
        } else {
            errors.push(
                node.createError("schema-error", {
                    pointer: `${node.schemaLocation}/then`,
                    schema: node.schema,
                    value: schema.then,
                    message: `Keyword 'then' must be valid JSON Schema - received '${typeof schema.then}'`
                })
            );
        }
    }
    if (schema.else != null) {
        if (isJsonSchema(schema.else) || isBooleanSchema(schema.else)) {
            node.else = node.compileSchema(schema.else, `${evaluationPath}/else`);
            collectValidationErrors(errors, node.else);
        } else {
            errors.push(
                node.createError("schema-error", {
                    pointer: `${node.schemaLocation}/else`,
                    schema: node.schema,
                    value: schema.else,
                    message: `Keyword 'else' must be valid JSON Schema - received '${typeof schema.else}'`
                })
            );
        }
    }
    return errors;
}

function reduceIf({ node, data, key, pointer, path }: JsonSchemaReducerParams) {
    // @todo issue with mergeNode (node.if == null)
    if (data === undefined || node.if == null) {
        return undefined;
    }

    if (validateNode(node.if, data, pointer, [...(path ?? [])]).length === 0) {
        if (node.then) {
            // reduce creates a new node
            const { node: schemaNode } = node.then.reduceNode(data, { key, pointer, path: [...path] });
            if (schemaNode) {
                const nestedDynamicId = schemaNode.dynamicId?.replace(node.dynamicId, "").replace(/^#/, "") ?? "";
                const dynamicId = nestedDynamicId === "" ? `(then)` : nestedDynamicId;

                const reduced = isBooleanSchema(node.then.schema) ? node.then : schemaNode;
                const result = node.compileSchema(
                    reduced.schema,
                    node.then.evaluationPath,
                    node.schemaLocation,
                    `${node.schemaLocation}${dynamicId}`
                );
                return mergeReducedNode(result, reduced, "if", "then", "else");
            }
        }
    } else if (node.else) {
        const { node: schemaNode } = node.else.reduceNode(data, { key, pointer, path: [...path] });
        if (schemaNode) {
            const nestedDynamicId = schemaNode.dynamicId?.replace(node.dynamicId, "") ?? "";
            const dynamicId = nestedDynamicId === "" ? `(else)` : nestedDynamicId;

            const reduced = isBooleanSchema(node.else.schema) ? node.else : schemaNode;
            const result = node.compileSchema(
                reduced.schema,
                node.else.evaluationPath,
                node.schemaLocation,
                `${node.schemaLocation}${dynamicId}`
            );
            return mergeReducedNode(result, reduced, "if", "then", "else");
        }
    }
    return undefined;
}

function validateIfThenElse({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    // @todo issue with mergeNode
    if (node.if == null) {
        return;
    }
    if (validateNode(node.if, data, pointer, [...(path ?? [])]).length === 0) {
        if (node.then) {
            return validateNode(node.then, data, pointer, path);
        }
    } else if (node.else) {
        return validateNode(node.else, data, pointer, path);
    }
}
