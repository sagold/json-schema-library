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
            node.$defs = node.$defs ?? {};
            Object.keys(node.schema.$defs).forEach((property) => {
                node.$defs![property] = node.compileSchema(
                    node.schema.$defs[property],
                    `${node.evaluationPath}/$defs/${urlEncodeJsonPointerProperty(property)}`,
                    `${node.schemaLocation}/$defs/${property}`
                );
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
        node.$defs = node.$defs ?? {};
        Object.keys(node.schema.definitions).forEach((property) => {
            node.$defs![property] = node.compileSchema(
                node.schema.definitions[property],
                `${node.evaluationPath}/definitions/${urlEncodeJsonPointerProperty(property)}`,
                `${node.schemaLocation}/definitions/${urlEncodeJsonPointerProperty(property)}`
            );
        });
    }

    return errors;
}

function urlEncodeJsonPointerProperty(property: string) {
    property = property.replace(/~/g, "~0");
    property = property.replace(/\//g, "~1");
    return encodeURIComponent(property);
}
