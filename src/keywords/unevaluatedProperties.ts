import { isObject } from "../utils/isObject";
import { isBooleanSchema, isJsonSchema, SchemaNode } from "../types";
import { Keyword, JsonSchemaValidatorParams, ValidationReturnType } from "../Keyword";
import { validateNode } from "../validateNode";
import { isPropertyEvaluated } from "../isPropertyEvaluated";

const KEYWORD = "unevaluatedProperties";

export const unevaluatedPropertiesKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseUnevaluatedProperties,
    addValidate: ({ schema }) => schema[KEYWORD] != null, // currently we do not store boolean schema
    validate: validateUnevaluatedProperties
};

export function parseUnevaluatedProperties(node: SchemaNode) {
    const unevaluatedProperties = node.schema[KEYWORD];
    if (unevaluatedProperties == null) {
        return;
    }
    if (!(isJsonSchema(unevaluatedProperties) || isBooleanSchema(unevaluatedProperties))) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: unevaluatedProperties,
            message: `Keyword '${KEYWORD}' must be a valid JSON Schema - received '${typeof unevaluatedProperties}'`
        });
    }

    if (isBooleanSchema(unevaluatedProperties)) {
        return;
    }

    node.unevaluatedProperties = node.compileSchema(
        node.schema.unevaluatedProperties,
        `${node.evaluationPath}/${KEYWORD}`,
        `${node.schemaLocation}/${KEYWORD}`
    );
    return node.unevaluatedProperties.schemaValidation;
}

// @todo we should use collected annotation to evaluated unevaluate properties
function validateUnevaluatedProperties({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    if (!isObject(data)) {
        return undefined;
    }

    const unevaluated = Object.keys(data)
        // do not validate undefined properties
        .filter((property) => data[property] !== undefined);

    if (unevaluated.length === 0) {
        return undefined;
    }

    const errors: ValidationReturnType = [];
    for (const propertyName of unevaluated) {
        if (isPropertyEvaluated({ node, data, key: propertyName, pointer, path })) {
            continue;
        }

        const { node: child } = node.getNodeChild(propertyName, data, { pointer, path });

        if (child === undefined) {
            if (node.unevaluatedProperties) {
                const validationResult = validateNode(
                    node.unevaluatedProperties,
                    data[propertyName],
                    `${pointer}/${propertyName}`,
                    path
                );
                errors.push(...validationResult);
            } else if (node.schema.unevaluatedProperties === false) {
                errors.push(
                    node.createError("unevaluated-property-error", {
                        pointer: `${pointer}/${propertyName}`,
                        value: JSON.stringify(data[propertyName]),
                        schema: node.schema
                    })
                );
            }
        }

        if (child && validateNode(child, data[propertyName], `${pointer}/${propertyName}`, path).length > 0) {
            if (node.unevaluatedProperties) {
                const validationResult = validateNode(
                    node.unevaluatedProperties,
                    data[propertyName],
                    `${pointer}/${propertyName}`,
                    path
                );
                errors.push(...validationResult);
            } else if (node.schema.unevaluatedProperties === false) {
                errors.push(
                    node.createError("unevaluated-property-error", {
                        pointer: `${pointer}/${propertyName}`,
                        value: JSON.stringify(data[propertyName]),
                        schema: node.schema
                    })
                );
            }
        }
    }

    return errors;
}
