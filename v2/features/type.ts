import getTypeOf, { JSType } from "../../lib/getTypeOf";
import { JsonSchemaReducerParams, JsonSchemaValidatorParams, SchemaNode } from "../types";

export function parseType(node: SchemaNode) {
    if (Array.isArray(node.schema.type)) {
        node.reducers.push(reduceType);
    }
}

reduceType.toJSON = () => "reduceType";
function reduceType({ node, data }: JsonSchemaReducerParams): undefined | SchemaNode {
    const dataType = getJsonSchemaType(data, node.schema.type);
    if (dataType !== "undefined" && Array.isArray(node.schema.type) && node.schema.type.includes(dataType)) {
        return node.compileSchema({ ...node.schema, type: dataType }, node.spointer);
    }
    return undefined;
}

function getJsonSchemaType(value: unknown, expectedType: string | string[]): JSType | "integer" {
    const jsType = getTypeOf(value);
    if (
        jsType === "number" &&
        (expectedType === "integer" || (Array.isArray(expectedType) && expectedType.includes("integer")))
    ) {
        return Number.isInteger(value) || isNaN(value as any) ? "integer" : "number";
    }
    return jsType;
}

export function typeValidator({ schema, validators }: SchemaNode): void {
    if (schema.type == null) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        const dataType = getJsonSchemaType(data, schema.type);
        if (
            data === undefined ||
            schema.type === dataType ||
            (Array.isArray(schema.type) && schema.type.includes(dataType))
        ) {
            return;
        }
        return node.errors.typeError({
            value: data,
            received: dataType,
            expected: schema.type,
            schema,
            pointer
        });
    });
}
