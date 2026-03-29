import { isObject } from "../utils/isObject";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { hasProperty } from "../utils/hasProperty";
import { SchemaNode } from "../SchemaNode";
import { isListOfStrings } from "../utils/isListOfStrings";

const KEYWORD = "required";

export const requiredKeyword: Keyword<"required"> = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseRequired,
    addValidate: (node) => node.required != null,
    validate: validateRequired
};

function parseRequired(node: SchemaNode) {
    const required = node.schema[KEYWORD];
    if (required == null) {
        return;
    }

    if (!isListOfStrings(required)) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: required,
            message: `Keyword '${KEYWORD}' must be a string[]`
        });
    }

    node.required = required;
}

function validateRequired({ node, data, pointer = "#" }: JsonSchemaValidatorParams<"required">) {
    const { required } = node;
    if (!isObject(data)) {
        return undefined;
    }
    return required.map((property: string) => {
        if (!hasProperty(data, property)) {
            return node.createError("required-property-error", {
                key: property,
                pointer,
                schema: node.schema,
                value: data
            });
        }
        return undefined;
    });
}
