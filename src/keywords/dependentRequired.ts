import { Keyword, JsonSchemaValidatorParams, ValidationReturnType, ValidationAnnotation } from "../Keyword";
import { JsonError, SchemaNode } from "../types";
import { isListOfStrings } from "../utils/isListOfStrings";
import { isObject } from "../utils/isObject";

const KEYWORD = "dependentRequired";

export const dependentRequiredKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseDependentRequired,
    addValidate: (node) => node[KEYWORD] != null,
    validate: validateDependentRequired
};

export function parseDependentRequired(node: SchemaNode) {
    const { schema } = node;
    if (schema[KEYWORD] == null) {
        return;
    }
    if (!isObject(schema[KEYWORD])) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema,
            value: schema[KEYWORD],
            message: `Keyword '${KEYWORD}' must be an object - received '${typeof schema[KEYWORD]}'`
        });
    }

    const errors: ValidationAnnotation[] = [];
    node.dependentRequired = {};
    for (const propertyName of Object.keys(schema[KEYWORD])) {
        const list = schema[KEYWORD][propertyName];
        if (isListOfStrings(list)) {
            node.dependentRequired[propertyName] = list;
        } else {
            errors.push(
                node.createError("schema-error", {
                    pointer: `${node.schemaLocation}/${KEYWORD}/${propertyName}`,
                    schema,
                    value: list,
                    message: `Keyword '${KEYWORD}[string]' must be a string[] - received '${typeof list}'`
                })
            );
        }
    }

    return errors;
}

export function validateDependentRequired({
    node,
    data,
    pointer = "#"
}: JsonSchemaValidatorParams): ValidationReturnType {
    const { dependentRequired } = node;
    if (dependentRequired == null || !isObject(data)) {
        return undefined;
    }
    const errors: JsonError[] = [];
    Object.keys(data).forEach((property) => {
        const dependencies = dependentRequired[property];
        if (!Array.isArray(dependencies)) {
            return;
        }
        for (let i = 0, l = dependencies.length; i < l; i += 1) {
            if (data[dependencies[i]] === undefined) {
                errors.push(
                    node.createError("missing-dependency-error", {
                        missingProperty: dependencies[i],
                        pointer,
                        schema: node.schema,
                        value: data
                    })
                );
            }
        }
    });
    return errors;
}
