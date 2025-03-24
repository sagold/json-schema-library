import settings from "../settings";
import { isObject } from "../utils/isObject";
import { Feature, JsonSchemaResolverParams, JsonSchemaValidatorParams, SchemaNode, JsonError } from "../types";
import { getValue } from "../utils/getValue";

export const additionalPropertiesFeature: Feature = {
    id: "additionalProperties",
    keyword: "additionalProperties",
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
    const { schema, spointer, schemaId } = node;
    if (isObject(schema.additionalProperties)) {
        node.additionalProperties = node.compileSchema(
            schema.additionalProperties,
            `${spointer}/additionalProperties`,
            `${schemaId}/additionalProperties`
        );
    }
}

function additionalPropertyResolver({ node, data, key }: JsonSchemaResolverParams) {
    const value = getValue(data, key);
    if (node.additionalProperties) {
        return node.additionalProperties.reduce({ data: value });
    }
    if (node.schema.additionalProperties === false) {
        return node.errors.noAdditionalPropertiesError({
            pointer: `${key}`,
            schema: node.schema,
            value: getValue(data, key),
            property: `${key}`
            // @todo add pointer to resolver
            // properties: expectedProperties
        });
    }
}

function validateAdditionalProperty({ node, data, pointer = "#", path }: JsonSchemaValidatorParams) {
    if (!isObject(data)) {
        return;
    }

    const { schema } = node;
    if (isObject(schema.patternProperties) && schema.additionalProperties === false) {
        // this is an arrangement with patternProperties. patternProperties validate before additionalProperties:
        // https://spacetelescope.github.io/understanding-json-schema/reference/object.html#index-5
        return undefined;
    }

    const errors: JsonError[] = [];
    let receivedProperties = Object.keys(data).filter((prop) => settings.propertyBlacklist.includes(prop) === false);
    if (Array.isArray(node.patternProperties)) {
        // filter received properties by matching patternProperties
        receivedProperties = receivedProperties.filter((prop) => {
            for (let i = 0; i < node.patternProperties.length; i += 1) {
                if (node.patternProperties[i].pattern.test(prop)) {
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
            if (isObject(node.additionalProperties)) {
                const validationErrors = node.additionalProperties.validate(propertyValue, pointer, path);
                // @note: we pass through specific errors here
                errors.push(...validationErrors);
            } else {
                errors.push(
                    node.errors.noAdditionalPropertiesError({
                        pointer,
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
