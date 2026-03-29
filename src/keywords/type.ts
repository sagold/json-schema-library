import { getTypeOf, JSType } from "../utils/getTypeOf";
import { SchemaNode } from "../types";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams } from "../Keyword";

const KEYWORD = "type";
const validTyes = ["null", "boolean", "number", "integer", "string", "object", "array"];

export const typeKeyword: Keyword<"type"> = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseType,
    addReduce: (node) => Array.isArray(node.type),
    reduce: reduceType,
    addValidate: (node) => node.type != null,
    validate: validateType
};

function parseType(node: SchemaNode) {
    const type = node.schema[KEYWORD];
    if (type == null) {
        return;
    }
    if (typeof type !== "string" && !Array.isArray(type)) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: type,
            message: `Keyword '${KEYWORD}' must be a string or a string[] - received ${typeof type}`
        });
    }
    if (typeof type === "string" && !validTyes.includes(type)) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: type,
            message: `Keyword '${KEYWORD}' is not a valid JSON Schema type - received '${type}'. Expected one of ${validTyes.join(", ")}`
        });
    }

    if (Array.isArray(type)) {
        const invalidTypeIndex = type.findIndex((t) => !validTyes.includes(t));
        if (invalidTypeIndex !== -1) {
            return node.createError("schema-error", {
                pointer: `${node.schemaLocation}/${KEYWORD}/${invalidTypeIndex}`,
                schema: node.schema,
                value: type[invalidTypeIndex],
                message: `Keyword '${KEYWORD}' contains an invalid JSON Schema type: '${type[invalidTypeIndex]}'`
            });
        }
    }

    node[KEYWORD] = type;
}

function reduceType({ node, pointer, data }: JsonSchemaReducerParams): undefined | SchemaNode {
    const dataType = getJsonSchemaType(data, node.type!);
    if (dataType !== "undefined" && Array.isArray(node.schema.type) && node.schema.type.includes(dataType)) {
        return node.compileSchema({ ...node.schema, pointer, type: dataType }, node.evaluationPath);
    }
    return undefined;
}

function getJsonSchemaType(value: unknown, expectedType: string | string[]): JSType | "integer" {
    const jsType = getTypeOf(value);
    if (
        jsType === "number" &&
        (expectedType === "integer" || (Array.isArray(expectedType) && expectedType.includes("integer")))
    ) {
        return Number.isInteger(value) || isNaN(value as number) ? "integer" : "number";
    }
    return jsType;
}

function validateType({ node, data, pointer }: JsonSchemaValidatorParams<"type">) {
    const type = node[KEYWORD];
    const dataType = getJsonSchemaType(data, type);
    if (data === undefined || type === dataType || (Array.isArray(type) && type.includes(dataType))) {
        return;
    }

    return node.createError("type-error", {
        value: data,
        received: dataType,
        expected: type,
        schema: node.schema,
        pointer
    });
}
