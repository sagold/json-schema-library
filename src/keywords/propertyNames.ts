import { JsonError } from "../types";
import { isObject } from "../utils/isObject";
import { SchemaNode } from "../types";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { validateNode } from "../validateNode";

export const propertyNamesKeyword: Keyword = {
    id: "propertyNames",
    keyword: "propertyNames",
    parse: parsePropertyNames,
    addValidate: ({ schema }) => schema.propertyNames != null,
    validate: validatePropertyNames
};

export function parsePropertyNames(node: SchemaNode) {
    const { propertyNames } = node.schema;
    if (propertyNames == null) {
        return;
    }
    if (isObject(propertyNames)) {
        node.propertyNames = node.compileSchema(
            propertyNames,
            `${node.spointer}/propertyNames`,
            `${node.schemaId}/propertyNames`
        );
    }
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
        return node.createError("InvalidPropertyNameError", {
            property: Object.keys(data),
            pointer,
            value: data,
            schema
        });
    }

    if (schema.propertyNames === true) {
        return undefined;
    }

    if (!isObject(node.propertyNames)) {
        // ignore invalid schema
        return undefined;
    }

    const errors: JsonError[] = [];
    const properties = Object.keys(data);
    properties.forEach((prop) => {
        const validationResult = validateNode(node.propertyNames, prop, `${pointer}/prop`, path);
        if (validationResult.length > 0) {
            errors.push(
                node.createError("InvalidPropertyNameError", {
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
