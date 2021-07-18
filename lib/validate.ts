import getTypeOf from "./getTypeOf";
import { errorOrPromise } from "./utils/filter";
import flattenArray from "./utils/flattenArray";
import { JSONSchema, JSONPointer, JSONError } from "./types";
import Core from "./cores/CoreInterface";
import equal from "fast-deep-equal";


function getJsonSchemaType(value, expectedType) {
    let jsType = getTypeOf(value);

    if (
        jsType === "number" && (expectedType === "integer" ||
        (Array.isArray(expectedType) && expectedType.includes("integer")))
    ) {
        jsType = Number.isInteger(value) ? "integer" : "number";
    }
    return jsType;
}


/**
 * Validate data by a json schema
 *
 * @param core - validator
 * @param value - value to validate
 * @param [schema] - json schema, defaults to rootSchema
 * @param [pointer] - json pointer pointing to value (used for error-messages only)
 * @return list of errors or empty
 */
export default function validate(core: Core, value: any, schema: JSONSchema = core.rootSchema, pointer: JSONPointer = "#"): Array<JSONError> {
    // @todo this is a high level v7 schema validation
    // @ts-ignore
    if (schema === true) {
        return [];
    }
    // @todo this is a high level v7 schema validation
    // @ts-ignore
    if (schema === false) {
        return [core.errors.invalidDataError({ value, pointer })];
    }

    if (schema.type === "error") {
        return [schema as JSONError];
    }

    schema = core.resolveRef(schema);

    // @draft >= 6 const
    if (schema.const !== undefined) {
        if (equal(schema.const, value)) {
            return [];
        }
        return [core.errors.constError({ value, expected: schema.const, pointer })];
    }

    const receivedType = getJsonSchemaType(value, schema.type);
    const expectedType = schema.type || receivedType;

    if (receivedType !== expectedType && (!Array.isArray(expectedType) || !expectedType.includes(receivedType))) {
        return [core.errors.typeError({ received: receivedType, expected: expectedType, value, pointer })];
    }

    if (core.validateType[receivedType] == null) {
        return [core.errors.invalidTypeError({ receivedType, pointer })];
    }

    const errors = flattenArray(core.validateType[receivedType](core, schema, value, pointer));
    // also promises may be passed along (validateAsync)
    return errors.filter(errorOrPromise);
}
