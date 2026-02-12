import settings from "../settings";
import { isObject } from "../utils/isObject";
import { Keyword, JsonSchemaResolverParams, JsonSchemaValidatorParams, ValidationReturnType} from "../Keyword";
import { SchemaNode } from "../types";
import { getValue } from "../utils/getValue";
import { validateNode } from "../validateNode";

export const additionalPropertiesKeyword: Keyword = {
    id: "additionalProperties",
    keyword: "additionalProperties",
    order: -10,
    parse: parseAdditionalProperties,
    addResolve: ({ schema }) => schema.additionalProperties != null,
    resolve: additionalPropertyResolver,
    addValidate: ({ schema }) =>
        schema.additionalProperties !== true &&
        schema.additionalProperties != null &&
        // this is an arrangement with patternProperties. patternProperties validate before additionalProperties:
        // https://spacetelescope.github.io/understanding-json-schema/reference/object.html#index-5
        !(schema.additionalProperties === false && isObject(schema.patternProperties)),
    validate: validateAdditionalProperty
};

// must come as last resolver
export function parseAdditionalProperties(node: SchemaNode) {
    const { schema, evaluationPath, schemaLocation } = node;
    if (isObject(schema.additionalProperties)) {
        node.additionalProperties = node.compileSchema(
            schema.additionalProperties,
            `${evaluationPath}/additionalProperties`,
            `${schemaLocation}/additionalProperties`
        );
    }
}

function additionalPropertyResolver({ node, data, key }: JsonSchemaResolverParams) {
    const value = getValue(data, key);
    if (node.additionalProperties) {
        const { node: reduced, error } = node.additionalProperties.reduceNode(value);
        return reduced ?? error;
    }
    if (node.schema.additionalProperties === false) {
        return node.createError("no-additional-properties-error", {
            pointer: `${key}`,
            schema: node.schema,
            value: getValue(data, key),
            property: `${key}`
            // @todo add pointer to resolver
            // properties: expectedProperties
        });
    }
}

/**
 * @additionalProperties only checks properties and additionalProperties
 *
 * The additionalProperties keyword is used to control the handling of extra stuff, that is,
 * properties whose names are not listed in the properties keyword or match any of the regular
 * expressions in the patternProperties keyword. By default any additional properties are allowed.
 * https://json-schema.org/understanding-json-schema/reference/object
 */
function validateAdditionalProperty({ node, data, pointer = "#", path }: JsonSchemaValidatorParams) {
    if (!isObject(data)) {
        return;
    }

    const { schema } = node;
    const errors: ValidationReturnType = [];
    let receivedProperties = Object.keys(data).filter((prop) => settings.propertyBlacklist.includes(prop) === false);
    const patternProperties = node.patternProperties;
    if (Array.isArray(patternProperties)) {
        // filter received properties by matching patternProperties
        receivedProperties = receivedProperties.filter((prop) => {
            for (const property of patternProperties) {
                if (property.pattern.test(prop)) {
                    return false; // remove
                }
            }
            return true;
        });
    }

    // adds an error for each an unexpected property
    const expectedProperties = node.properties ? Object.keys(node.properties) : [];
    receivedProperties
        .filter((property) => expectedProperties.indexOf(property) === -1)
        .forEach((property) => {
            const propertyValue = getValue(data, property);
            if (propertyValue === undefined) {
                return; // do not validate undefined properties
            }

            if (isObject(node.additionalProperties)) {
                const validationErrors = validateNode(
                    node.additionalProperties,
                    propertyValue,
                    `${pointer}/${property}`,
                    path
                );
                if (validationErrors) {
                    // @note: we pass through specific errors here
                    errors.push(...validationErrors);
                }
            } else {
                errors.push(
                    node.createError("no-additional-properties-error", {
                        pointer: `${pointer}/${property}`,
                        schema,
                        value: data,
                        property,
                        properties: expectedProperties
                    })
                );
            }
        });

    return errors;
}
