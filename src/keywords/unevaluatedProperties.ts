import { isObject } from "../utils/isObject.js";
import { SchemaNode } from "../types.js";
import { Keyword, JsonSchemaValidatorParams, ValidationResult } from "../Keyword.js";
import { validateNode } from "../validateNode.js";
import { isPropertyEvaluated } from "../isPropertyEvaluated.js";

export const unevaluatedPropertiesKeyword: Keyword = {
    id: "unevaluatedProperties",
    keyword: "unevaluatedProperties",
    parse: parseUnevaluatedProperties,
    addValidate: ({ schema }) => schema.unevaluatedProperties != null,
    validate: validateUnevaluatedProperties
};

export function parseUnevaluatedProperties(node: SchemaNode) {
    if (!isObject(node.schema.unevaluatedProperties)) {
        return;
    }
    node.unevaluatedProperties = node.compileSchema(
        node.schema.unevaluatedProperties,
        `${node.evaluationPath}/unevaluatedProperties`,
        `${node.schemaLocation}/unevaluatedProperties`
    );
}

// @todo we should use collected annotation to evaluated unevaluate properties
function validateUnevaluatedProperties({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    if (!isObject(data)) {
        return undefined;
    }

    const unevaluated = Object.keys(data);
    if (unevaluated.length === 0) {
        return undefined;
    }

    const errors: ValidationResult[] = [];
    for (let i = 0; i < unevaluated.length; i += 1) {
        const propertyName = unevaluated[i];

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
