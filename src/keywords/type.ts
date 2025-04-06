import getTypeOf, { JSType } from "../utils/getTypeOf";
import { SchemaNode } from "../types";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams } from "../Keyword";

export const typeKeyword: Keyword = {
    id: "type",
    keyword: "type",
    addReduce: (node) => Array.isArray(node.schema.type),
    reduce: reduceType,
    addValidate: ({ schema }) => schema.type != null,
    validate: validateType
};

function reduceType({ node, pointer, data }: JsonSchemaReducerParams): undefined | SchemaNode {
    const dataType = getJsonSchemaType(data, node.schema.type);
    if (dataType !== "undefined" && Array.isArray(node.schema.type) && node.schema.type.includes(dataType)) {
        return node.compileSchema({ ...node.schema, pointer, type: dataType }, node.spointer);
    }
    return undefined;
}

function getJsonSchemaType(value: unknown, expectedType: string | string[]): JSType | "integer" {
    const jsType = getTypeOf(value);
    if (
        jsType === "number" &&
        (expectedType === "integer" || (Array.isArray(expectedType) && expectedType.includes("integer")))
    ) {
        return Number.isInteger(value) || isNaN(value as any) ? "integer" : "number";
    }
    return jsType;
}

function validateType({ node, data, pointer }: JsonSchemaValidatorParams) {
    const schema = node.schema;
    const dataType = getJsonSchemaType(data, schema.type);
    if (
        data === undefined ||
        schema.type === dataType ||
        (Array.isArray(schema.type) && schema.type.includes(dataType))
    ) {
        return;
    }

    return node.errors.typeError({
        value: data,
        received: dataType,
        expected: schema.type,
        schema,
        pointer
    });
}
