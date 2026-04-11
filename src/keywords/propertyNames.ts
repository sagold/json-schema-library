import { isBooleanSchema, isJsonSchema, JsonError } from "../types";
import { isObject } from "../utils/isObject";
import { SchemaNode } from "../types";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { validateNode } from "../validateNode";

const KEYWORD = "propertyNames";

export const propertyNamesKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parsePropertyNames,
    addValidate: (node) => node.schema[KEYWORD] != null,
    validate: validatePropertyNames
};

export function parsePropertyNames(node: SchemaNode) {
    const propertyNames = node.schema[KEYWORD];
    if (propertyNames == null) {
        return;
    }
    if (!(isJsonSchema(propertyNames) || isBooleanSchema(propertyNames))) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: propertyNames,
            message: `Keyword '${KEYWORD}' must be a valid JSON Schema - received '${typeof propertyNames}'`
        });
    }
    if (isBooleanSchema(propertyNames)) {
        return;
    }
    node.propertyNames = node.compileSchema(
        propertyNames,
        `${node.evaluationPath}/propertyNames`,
        `${node.schemaLocation}/propertyNames`
    );
    return node.propertyNames.schemaValidation;
}

function validatePropertyNames({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    const { schema } = node;
    if (!isObject(data)) {
        return undefined;
    }

    // bool schema
    if (schema.propertyNames === false) {
        // empty objects are valid
        if (Object.keys(data).length === 0) {
            return undefined;
        }
        return node.createError("invalid-property-name-error", {
            property: Object.keys(data),
            pointer,
            value: data,
            schema
        });
    }

    if (schema[KEYWORD] === true) {
        return undefined;
    }

    const propertyNames = node[KEYWORD];
    if (!isObject(propertyNames)) {
        // ignore invalid schema
        return undefined;
    }

    const errors: JsonError[] = [];
    const properties = Object.keys(data);
    properties.forEach((prop) => {
        const validationResult = validateNode(propertyNames, prop, `${pointer}/${prop}`, path);
        if (validationResult.length > 0) {
            errors.push(
                node.createError("invalid-property-name-error", {
                    property: prop,
                    pointer,
                    validationError: validationResult[0],
                    value: data[prop],
                    schema
                })
            );
        }
    });

    return errors;
}
