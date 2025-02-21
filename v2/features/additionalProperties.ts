import settings from "../../lib/config/settings";
import { JsonError } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaResolverParams, JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";
import { getValue } from "../getValue";

additionalPropertyResolver.toJSON = () => "additionalPropertyResolver";
function additionalPropertyResolver({ node, data, key }: JsonSchemaResolverParams) {
    const value = getValue(data, key);
    if (node.additionalProperties) {
        return node.additionalProperties.reduce({ data: value });
    }
    const schema = node.draft.createSchemaOf(value);
    // undefined does not create a schema
    if (schema) {
        const temporaryNode = node.compileSchema(node.draft, schema, node.spointer, node);
        return temporaryNode;
    }
}

// must come as last resolver
export function parseAdditionalProperties(node: SchemaNode) {
    const { draft, schema, spointer } = node;
    if (schema.additionalProperties === false) {
        return;
    }
    if (isObject(schema.additionalProperties)) {
        node.additionalProperties = node.compileSchema(
            draft,
            schema.additionalProperties,
            `${spointer}/additionalProperties`,
            node
        );
    }
    node.resolvers.push(additionalPropertyResolver);
}

export function additionalPropertiesValidator({ schema, validators }: SchemaNode): void {
    if (schema.additionalProperties === true || schema.additionalProperties == null) {
        return;
    }
    // note: additionalProperties already parsed
    // note: properties, etc already tested
    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
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

        // adds an error for each an unexpected property
        for (let i = 0, l = receivedProperties.length; i < l; i += 1) {
            const property = receivedProperties[i];
            if (expectedProperties.indexOf(property) === -1) {
                const additionalIsObject = isObject(node.additionalProperties);

                // additionalProperties { oneOf: [] }
                if (additionalIsObject && Array.isArray(schema.additionalProperties.oneOf)) {
                    // @todo oneOf
                    // const result = draft.resolveOneOf(
                    //     node.next(schema.additionalProperties as JsonSchema),
                    //     getValue(data, property)
                    // );
                    // if (isJsonError(result)) {
                    //     errors.push(
                    //         draft.errors.additionalPropertiesError({
                    //             pointer,
                    //             schema: schema.additionalProperties,
                    //             value: data,
                    //             property: receivedProperties[i],
                    //             properties: expectedProperties,
                    //             // pass all validation errors
                    //             errors: result.data.errors
                    //         })
                    //     );
                    // } else {
                    //     errors.push(...draft.validate(node.next(result, property), value[property]));
                    // }
                } else if (node.additionalProperties) {
                    const validationErrors = node.additionalProperties.validate(getValue(data, property));
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
