import { JsonError } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";

export function propertyNamesValidator(node: SchemaNode): void {
    if (node.schema.propertyNames == null) {
        return;
    }
    const { propertyNames } = node.schema;
    if (isObject(propertyNames)) {
        node.propertyNames = node.compileSchema(propertyNames, `${node.spointer}/propertyNames`);
    }
    node.validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        const { draft, schema } = node;
        if (!isObject(data)) {
            return undefined;
        }

        // bool schema
        if (schema.propertyNames === false) {
            // empty objects are valid
            if (Object.keys(data).length === 0) {
                return undefined;
            }
            return draft.errors.invalidPropertyNameError({
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
            const validationResult = node.propertyNames.validate(prop);
            if (validationResult.length > 0) {
                errors.push(
                    draft.errors.invalidPropertyNameError({
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
    });
}
