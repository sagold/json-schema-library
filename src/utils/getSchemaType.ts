import { getTypeOf } from "./getTypeOf";
import { isObject } from "../utils/isObject";
import { BooleanSchema, JsonSchema, SchemaNode } from "../types";

export const SCHEMA_TYPES = ["string", "number", "integer", "boolean", "null", "array", "object"] as const;
export type SchemaType = (typeof SCHEMA_TYPES)[number];
const OBJECT_PROPERTIES = [
    "additionalProperties",
    // "allOf",
    // "anyOf",
    "dependencies",
    "dependentSchemas",
    "dependentRequired",
    // "enum",
    // "format",
    // "if",
    "maxProperties",
    "minProperties",
    // "not",
    // "oneOf",
    "patternProperties",
    "properties",
    "propertyNames",
    "required",
    "unevaluatedProperties" // 2019-09
];
const ARRAY_PROPERTIES = [
    // "allOf",
    // "anyOf",
    "contains",
    // "enum",
    // "if",
    "items",
    "maxItems",
    "minItems",
    // "not",
    // "oneOf",
    "unevaluatedItems",
    "uniqueItems"
];

/**
 * @helper for getData
 * returns schema type, which might be an educated guess based on defined schema
 * properties if an exact type cannot be retried from type.
 */
export function getSchemaType(node: SchemaNode, data: unknown): SchemaType | undefined {
    const dataType = getTypeOf(data);
    const schema = node.schema as JsonSchema | BooleanSchema;
    if (schema === true) {
        if (dataType === "bigint") {
            return "number";
        }
        return SCHEMA_TYPES.some((schemaType) => schemaType === dataType) ? (dataType as SchemaType) : undefined;
    }
    // boolean schema false or invalid schema
    if (!isObject(schema)) {
        return undefined;
    }
    const schemaType = schema.type;

    // type: []
    if (Array.isArray(schemaType)) {
        if (schemaType.includes(dataType)) {
            return dataType as SchemaType;
        }
        const defaultType = getTypeOf(schema.default);
        if (schemaType.includes(defaultType)) {
            return defaultType as SchemaType;
        }
        return schemaType[0];
    }

    // type: ""
    if (schemaType) {
        return schemaType as SchemaType;
    }

    // type: undefined, enum: []
    if (Array.isArray(schema.enum)) {
        const schemaEnum: unknown[] = schema.enum;
        const enumSchemaType = schemaEnum.map((value) => getTypeOf(value)).filter((p, i, l) => l.indexOf(p) === i);
        if (enumSchemaType.includes(dataType)) {
            return dataType as SchemaType;
        }
        const defaultType = getTypeOf(schema.default);
        if (enumSchemaType.includes(defaultType)) {
            return defaultType as SchemaType;
        }
        return enumSchemaType[0] as SchemaType;
    }

    // type: undefined, enum: undefined -- define type by schema-properties
    // @attenation this is prone to wrong results
    const schemaProperties = Object.keys(node.schema);
    const objectProperties = schemaProperties.filter((p) => OBJECT_PROPERTIES.includes(p));
    const arrayProperties = schemaProperties.filter((p) => ARRAY_PROPERTIES.includes(p));

    if (objectProperties.length > 0 && objectProperties.length > arrayProperties.length) {
        return "object";
    }

    if (arrayProperties.length > 0 && arrayProperties.length > objectProperties.length) {
        return "array";
    }

    // nothing found yet check dynamic properties for a type
    if (node.if) {
        return getSchemaType(node.if.resolveRef?.() ?? node.if, data);
    }

    if (node.allOf) {
        for (let i = 0; i < node.allOf.length; i += 1) {
            const type = getSchemaType(node.allOf[i].resolveRef?.() ?? node.allOf[i], data);
            if (type) {
                return type;
            }
        }
    }

    if (node.oneOf) {
        for (let i = 0; i < node.oneOf.length; i += 1) {
            const type = getSchemaType(node.oneOf[i].resolveRef?.() ?? node.oneOf[i], data);
            if (type) {
                return type;
            }
        }
    }

    if (node.anyOf) {
        for (let i = 0; i < node.anyOf.length; i += 1) {
            const type = getSchemaType(node.anyOf[i].resolveRef?.() ?? node.anyOf[i], data);
            if (type) {
                return type;
            }
        }
    }

    return undefined;
}
