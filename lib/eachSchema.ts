import { JsonSchema, JsonPointer } from "./types";
import { isObject } from "./utils/isObject";

export type EachSchemaCallback = (schema: JsonSchema, pointer: JsonPointer) => void;

function eachProperty(
    property: string,
    schema: JsonSchema,
    callback: EachSchemaCallback,
    pointer: JsonPointer
) {
    const target = schema[property];
    if (!isObject(target)) {
        return;
    }
    Object.keys(target).forEach(key => {
        if (Array.isArray(target[key])) {
            // ignore depndencies list (of properties)
            return;
        }
        if (key === "$defs") {
            eachProperty("$defs", target[key], callback, `${pointer}/${property}/$defs`);
        } else {
            eachSchema(target[key], callback, `${pointer}/${property}/${key}`);
        }
    });
}

function eachItem(
    property: string,
    schema: JsonSchema,
    callback: EachSchemaCallback,
    pointer: JsonPointer
) {
    const target = schema[property];
    if (!Array.isArray(target)) {
        return;
    }
    target.forEach((s, key) => eachSchema(s, callback, `${pointer}/${property}/${key}`));
}


export function eachSchema(
    schema: JsonSchema,
    callback: EachSchemaCallback,
    pointer: JsonPointer = ""
) {
    if (schema === undefined) {
        return;
    }
    // @ts-expect-error untyped
    if (callback(schema, pointer) === true) {
        return;
    }
    if (!isObject(schema)) {
        return;
    }

    eachProperty("properties", schema, callback, pointer);
    eachProperty("patternProperties", schema, callback, pointer);
    eachSchema(schema.not, callback, `${pointer}/not`);
    eachSchema(schema.additionalProperties, callback, `${pointer}/additionalProperties`);
    eachProperty("dependencies", schema, callback, pointer);
    // items
    isObject(schema.items) && eachSchema(schema.items, callback, `${pointer}/items`);
    eachItem("items", schema, callback, pointer);
    // additional items
    eachSchema(schema.additionalItems, callback, `${pointer}/additionalItems`);
    // dynamic schemas
    eachItem("allOf", schema, callback, pointer);
    eachItem("anyOf", schema, callback, pointer);
    eachItem("oneOf", schema, callback, pointer);
    eachSchema(schema.if, callback, `${pointer}/if`);
    eachSchema(schema.then, callback, `${pointer}/then`);
    eachSchema(schema.else, callback, `${pointer}/else`);
    // definitions
    eachProperty("definitions", schema, callback, pointer);
    eachProperty("$defs", schema, callback, pointer);
}
