import getTypeOf from "./getTypeOf";
import { errorOrPromise } from "./utils/filter";
import flattenArray from "./utils/flattenArray";
import { isJSONError } from "./types";
import equal from "fast-deep-equal";
function getJsonSchemaType(value, expectedType) {
    const jsType = getTypeOf(value);
    if (jsType === "number" &&
        (expectedType === "integer" ||
            (Array.isArray(expectedType) && expectedType.includes("integer")))) {
        return Number.isInteger(value) || isNaN(value) ? "integer" : "number";
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
export default function validate(core, value, schema = core.rootSchema, pointer = "#") {
    schema = core.resolveRef(schema);
    // @draft >= 07
    if (getTypeOf(schema) === "boolean") {
        if (schema) {
            return [];
        }
        return [core.errors.invalidDataError({ value, pointer })];
    }
    if (isJSONError(schema)) {
        return [schema];
    }
    // @draft >= 6 const
    if (schema.const !== undefined) {
        if (equal(schema.const, value)) {
            return [];
        }
        return [core.errors.constError({ value, expected: schema.const, pointer })];
    }
    const receivedType = getJsonSchemaType(value, schema.type);
    const expectedType = schema.type || receivedType;
    if (receivedType !== expectedType &&
        (!Array.isArray(expectedType) || !expectedType.includes(receivedType))) {
        return [
            core.errors.typeError({
                received: receivedType,
                expected: expectedType,
                value,
                pointer
            })
        ];
    }
    if (core.validateType[receivedType] == null) {
        return [core.errors.invalidTypeError({ receivedType, pointer })];
    }
    const errors = flattenArray(core.validateType[receivedType](core, schema, value, pointer));
    // also promises may be passed along (validateAsync)
    // @ts-ignore
    return errors.filter(errorOrPromise);
}
