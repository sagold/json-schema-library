import { getPrecision } from "../utils/getPrecision";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { SchemaNode } from "../SchemaNode";
import { isNumber } from "../types";

const KEYWORD = "multipleOf";

export const multipleOfKeyword: Keyword<"multipleOf"> = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseMultipleOf,
    addValidate: (node) => node[KEYWORD] != null,
    validate: validateMultipleOf
};

function parseMultipleOf(node: SchemaNode) {
    const multipleOf = node.schema[KEYWORD];
    if (multipleOf == null) {
        return;
    }
    if (!isNumber(multipleOf)) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: multipleOf,
            message: `Keyword '${KEYWORD}' must be a number - received '${typeof multipleOf}'`
        });
    }
    node[KEYWORD] = multipleOf;
}

function validateMultipleOf({ node, data, pointer }: JsonSchemaValidatorParams<"multipleOf">) {
    if (typeof data !== "number") {
        return undefined;
    }
    const multipleOf = node[KEYWORD];
    const valuePrecision = getPrecision(data);
    const multiplePrecision = getPrecision(multipleOf);
    if (valuePrecision > multiplePrecision) {
        // value with higher precision then multipleOf-precision can never be multiple
        return node.createError("multiple-of-error", {
            multipleOf,
            value: data,
            pointer,
            schema: node.schema
        });
    }

    const precision = Math.pow(10, multiplePrecision);
    const val = Math.round(data * precision);
    const multiple = Math.round(multipleOf * precision);
    if ((val % multiple) / precision !== 0) {
        return node.createError("multiple-of-error", {
            multipleOf: multipleOf,
            value: data,
            pointer,
            schema: node.schema
        });
    }

    // maybe also check overflow
    // https://stackoverflow.com/questions/1815367/catch-and-compute-overflow-during-multiplication-of-two-large-integers
    return undefined;
}
