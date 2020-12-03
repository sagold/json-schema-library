import getTypeOf from "./getTypeOf";
import filter from "./utils/filter";
import flattenArray from "./utils/flattenArray";
function getJsonSchemaType(value, expectedType) {
    let jsType = getTypeOf(value);
    if (jsType === "number" && (expectedType === "integer" ||
        (Array.isArray(expectedType) && expectedType.includes("integer")))) {
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
export default function validate(core, value, schema = core.rootSchema, pointer = "#") {
    if (schema.type === "error") {
        return [schema];
    }
    schema = core.resolveRef(schema);
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
    return errors.filter(filter.errorOrPromise);
}
