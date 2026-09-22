import { join } from "@sagold/json-pointer";
import { collectValidationErrors } from "src/utils/collectValidationErrors";
import { Keyword, ValidationAnnotation } from "../Keyword";
import { SchemaNode } from "../types";
import { isObject } from "../utils/isObject";

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
            Object.keys(node.schema.$defs).forEach((property) => {
                const propertyPointer = join([property], true).slice(1);
                node.$defs![property] = node.compileSchema(
                    node.schema.$defs[property],
                    `${node.evaluationPath}/$defs${propertyPointer}`,
                    `${node.schemaLocation}/$defs${propertyPointer}`
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
        const definitions: Record<string, SchemaNode> = node.definitions ?? Object.create(null);
        node.definitions = definitions;
        // Keep the legacy alias only when there is no modern definition dictionary.
        node.$defs = node.$defs ?? definitions;
        Object.keys(node.schema.definitions).forEach((property) => {
            const propertyPointer = join([property], true).slice(1);
            definitions[property] = node.compileSchema(
                node.schema.definitions[property],
                `${node.evaluationPath}/definitions${propertyPointer}`,
                `${node.schemaLocation}/definitions${propertyPointer}`
            );
            collectValidationErrors(errors, definitions[property]);
        });
    }

    return errors;
}
