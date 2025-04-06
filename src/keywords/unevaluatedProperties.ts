import { isJsonError, isSchemaNode } from "../types";
import { isObject } from "../utils/isObject";
import { SchemaNode } from "../types";
import { Keyword, JsonSchemaValidatorParams, ValidationResult } from "../Keyword";
import { getValue } from "../utils/getValue";
import { validateNode } from "../validateNode";

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
        `${node.spointer}/unevaluatedProperties`,
        `${node.schemaId}/unevaluatedProperties`
    );
}

function validateUnevaluatedProperties({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    // if not in properties, evaluated by additionalProperties and not matches patternProperties
    // @todo we need to know dynamic parent statements - they should not be counted as evaluated...
    if (!isObject(data)) {
        return undefined;
    }

    // this will break?
    let reducedNode = node.reduce({ data, pointer, path });
    reducedNode = isSchemaNode(reducedNode) ? reducedNode : node;
    if (reducedNode.schema.unevaluatedProperties === true || reducedNode.schema.additionalProperties === true) {
        return undefined;
    }

    const unevaluated = Object.keys(data);
    if (unevaluated.length === 0) {
        return undefined;
    }

    const errors: ValidationResult[] = [];
    for (let i = 0; i < unevaluated.length; i += 1) {
        const propertyName = unevaluated[i];
        const child = node.get(propertyName, data, { path });

        if (isSchemaNode(child)) {
            if (validateNode(child, data[propertyName], `${pointer}/${propertyName}`, path).length > 0) {
                errors.push(
                    node.errors.unevaluatedPropertyError({
                        pointer: `${pointer}/${propertyName}`,
                        value: JSON.stringify(data[propertyName]),
                        schema: node.schema
                    })
                );
                continue;
            }
        }

        if (child === undefined) {
            if (node.if && isPropertyEvaluated(node.if, propertyName, data)) {
                // skip
            } else if (reducedNode.unevaluatedProperties) {
                const validationResult = validateNode(
                    node.unevaluatedProperties,
                    data[propertyName],
                    `${pointer}/${propertyName}`,
                    path
                );
                errors.push(...validationResult);
            } else if (reducedNode.schema.unevaluatedProperties === false) {
                errors.push(
                    node.errors.unevaluatedPropertyError({
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

/** tests if a property is evaluated by the given schema */
function isPropertyEvaluated(schemaNode: SchemaNode, propertyName: string, data: unknown) {
    const node = schemaNode.get(propertyName, data);
    if (node == null || isJsonError(node)) {
        return false;
    }
    return node.validate(getValue(data, propertyName)).length === 0;
}
