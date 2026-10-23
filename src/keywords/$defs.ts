import { collectValidationErrors } from "src/utils/collectValidationErrors";
import { Keyword, ValidationAnnotation } from "../Keyword";
import { SchemaNode } from "../types";
import { isObject } from "../utils/isObject";
import { iterateProperties } from "../utils/iterateProperties";

export const $defsKeyword: Keyword = {
    id: "$defs",
    keyword: "$defs",
    parse: parseDefs
};

export function parseDefs(node: SchemaNode) {
    const errors: ValidationAnnotation[] = [];

    if (node.schema.$defs) {
        if (!isObject(node.schema.$defs)) {
            errors.push(
                node.createError("schema-error", {
                    pointer: node.schemaLocation,
                    schema: node.schema,
                    value: node.schema.$defs,
                    message: `$defs must be an object - received: ${typeof node.schema.$defs}`
                })
            );
        } else {
            node.$defs = node.$defs ?? Object.create(null);
            iterateProperties(node.schema.$defs).forEach(([property, propertyPointer]) => {
                node.$defs![property] = node.compileSchema(
                    node.schema.$defs[property],
                    `${node.evaluationPath}/$defs/${propertyPointer}`,
                    `${node.schemaLocation}/$defs/${propertyPointer}`
                );
                collectValidationErrors(errors, node.$defs![property]);
            });
        }
    }
    if (node.schema.definitions) {
        if (!isObject(node.schema.definitions)) {
            errors.push(
                node.createError("schema-error", {
                    pointer: node.schemaLocation,
                    schema: node.schema,
                    value: node.schema.$defs,
                    message: `definitions must be an object - received: ${typeof node.schema.definitions}`
                })
            );
        }
        node.$defs = node.$defs ?? Object.create(null);
        iterateProperties(node.schema.definitions).forEach(([property, propertyPointer]) => {
            node.$defs![property] = node.compileSchema(
                node.schema.definitions[property],
                `${node.evaluationPath}/definitions/${propertyPointer}`,
                `${node.schemaLocation}/definitions/${propertyPointer}`
            );
            collectValidationErrors(errors, node.$defs![property]);
        });
    }

    return errors;
}
