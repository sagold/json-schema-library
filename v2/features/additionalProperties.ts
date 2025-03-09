import settings from "../../lib/config/settings";
import { JsonError } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaResolverParams, JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";
import { getValue } from "../utils/getValue";

// must come as last resolver
export function parseAdditionalProperties(node: SchemaNode) {
    const { schema, spointer } = node;
    if (schema.additionalProperties === false) {
        return;
    }
    if (isObject(schema.additionalProperties)) {
        node.additionalProperties = node.compileSchema(schema.additionalProperties, `${spointer}/additionalProperties`);
    }
    node.resolvers.push(additionalPropertyResolver);
}

additionalPropertyResolver.toJSON = () => "additionalPropertyResolver";
function additionalPropertyResolver({ node, data, key }: JsonSchemaResolverParams) {
    const value = getValue(data, key);
    if (node.additionalProperties) {
        return node.additionalProperties.reduce({ data: value });
    }
    // const schema = node.draft.createSchemaOf(value);
    // // undefined does not create a schema
    // if (schema) {
    //     const temporaryNode = node.compileSchema(schema, node.spointer);
    //     return temporaryNode;
    // }
}

export function additionalPropertiesValidator({ schema, validators }: SchemaNode): void {
    if (schema.additionalProperties === true || schema.additionalProperties == null) {
        return;
    }

    if (isObject(schema.patternProperties) && schema.additionalProperties === false) {
        // this is an arrangement with patternProperties. patternProperties validate before additionalProperties:
        // https://spacetelescope.github.io/understanding-json-schema/reference/object.html#index-5
        return undefined;
    }

    // note: additionalProperties already parsed
    // note: properties, etc already tested
    validators.push(({ node, data, pointer = "#", path }: JsonSchemaValidatorParams) => {
        if (!isObject(data)) {
            return;
        }

        const { draft, schema } = node;

        // @todo are all checks necessary?
        const errors: JsonError[] = [];
        let receivedProperties = Object.keys(data).filter(
            (prop) => settings.propertyBlacklist.includes(prop) === false
        );
        const expectedProperties = node.properties ? Object.keys(node.properties) : [];

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

        if (isObject(schema.patternProperties) && schema.additionalProperties === false) {
            // this is an arrangement with patternProperties. patternProperties validate before additionalProperties:
            // https://spacetelescope.github.io/understanding-json-schema/reference/object.html#index-5
            return undefined;
        }

        // adds an error for each an unexpected property
        for (let i = 0, l = receivedProperties.length; i < l; i += 1) {
            const property = receivedProperties[i];
            const propertyValue = getValue(data, property);
            if (expectedProperties.indexOf(property) === -1) {
                if (isObject(node.additionalProperties)) {
                    const validationErrors = node.additionalProperties.validate(propertyValue, pointer, path);
                    // @note: we pass through specific errors here
                    errors.push(...validationErrors);
                } else {
                    errors.push(
                        draft.errors.noAdditionalPropertiesError({
                            pointer,
                            schema,
                            value: data,
                            property: receivedProperties[i],
                            properties: expectedProperties
                        })
                    );
                }
            }
        }

        return errors;
    });
}
