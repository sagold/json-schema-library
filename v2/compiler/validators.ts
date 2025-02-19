import { JsonError } from "../../lib/types";
import { getValue } from "../getValue";
import { SchemaNode, JsonSchemaValidatorParams } from "./types";

export const VALIDATORS: ((node: SchemaNode) => void)[] = [
    function validateProperties(node) {
        if (node.properties) {
            // note: this expects PARSER to have compiled properties
            node.validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
                // move validation through properties
                const errors: JsonError[] = [];
                Object.keys(node.properties).forEach((propertyName) => {
                    const propertyNode = node.properties[propertyName];
                    const result = propertyNode.validate(getValue(data, propertyName), `${pointer}/${propertyName}`);
                    if (Array.isArray(result)) {
                        errors.push(...result);
                    } else if (result) {
                        errors.push(result);
                    }
                });
                return errors;
            });
        }
    },

    function validateMaxProperties(node) {
        const { schema, draft } = node;
        if (!isNaN(schema.maxProperties)) {
            node.validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
                const { schema } = node;
                const propertyCount = Object.keys(data).length;
                if (isNaN(schema.maxProperties) === false && schema.maxProperties < propertyCount) {
                    return draft.errors.maxPropertiesError({
                        maxProperties: schema.maxProperties,
                        length: propertyCount,
                        pointer,
                        schema,
                        value: data
                    });
                }
            });
        }
    }
];
