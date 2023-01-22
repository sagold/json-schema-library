import getTypeOf from "./getTypeOf";
import { errorOrPromise } from "./utils/filter";
import flattenArray from "./utils/flattenArray";
import { isJsonError } from "./types";
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
 * @param draft - validator
 * @param value - value to validate
 * @param [schema] - json schema, defaults to rootSchema
 * @param [pointer] - json pointer pointing to value (used for error-messages only)
 * @return list of errors or empty
 */
export default function validate(draft, value, schema = draft.rootSchema, pointer = "#") {
    schema = draft.resolveRef(schema);
    // this is a high level v7 schema validation
    if (getTypeOf(schema) === "boolean") {
        if (schema) {
            return [];
        }
        return [draft.errors.invalidDataError({ value, pointer })];
    }
    if (isJsonError(schema)) {
        return [schema];
    }
    // @draft >= 6 const
    if (schema.const !== undefined) {
        if (equal(schema.const, value)) {
            return [];
        }
        return [draft.errors.constError({ value, expected: schema.const, pointer })];
    }
    const receivedType = getJsonSchemaType(value, schema.type);
    const expectedType = schema.type || receivedType;
    if (receivedType !== expectedType &&
        (!Array.isArray(expectedType) || !expectedType.includes(receivedType))) {
        return [
            draft.errors.typeError({
                received: receivedType,
                expected: expectedType,
                value,
                pointer
            })
        ];
    }
    if (draft.validateType[receivedType] == null) {
        return [draft.errors.invalidTypeError({ receivedType, pointer })];
    }
    const errors = flattenArray(draft.validateType[receivedType](draft, schema, value, pointer));
    // also promises may be passed along (validateAsync)
    // @ts-ignore
    return errors.filter(errorOrPromise);
}
