import getTypeOf from "./getTypeOf";
import { errorOrPromise } from "./utils/filter";
import flattenArray from "./utils/flattenArray";
import { isJsonError } from "./types";
import { isSchemaNode } from "./schemaNode";
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
 * Validates data with json schema
 *
 * @param draft - validator
 * @param value - value to validate
 * @param [schema] - json schema, defaults to rootSchema
 * @param [pointer] - json pointer pointing to value (used for error-messages only)
 * @return list of errors or empty
 */
export default function validate(node, value) {
    if (!isSchemaNode(node)) {
        throw new Error("node expected");
    }
    const { draft, pointer } = node;
    node = node.resolveRef();
    const schema = node.schema;
    if (schema == null) {
        throw new Error("missing schema");
    }
    // @draft >= 07
    if (getTypeOf(schema) === "boolean") {
        if (schema) {
            return [];
        }
        return [draft.errors.invalidDataError({ pointer, schema, value })];
    }
    if (isJsonError(schema)) {
        return [schema];
    }
    // @draft >= 6 const
    if (schema.const !== undefined) {
        if (equal(schema.const, value)) {
            return [];
        }
        return [draft.errors.constError({ pointer, schema, value, expected: schema.const })];
    }
    const receivedType = getJsonSchemaType(value, schema.type);
    const expectedType = schema.type || receivedType;
    if (receivedType !== expectedType &&
        (!Array.isArray(expectedType) || !expectedType.includes(receivedType))) {
        return [
            draft.errors.typeError({
                pointer,
                schema,
                value,
                received: receivedType,
                expected: expectedType
            })
        ];
    }
    if (draft.validateType[receivedType] == null) {
        return [draft.errors.invalidTypeError({ pointer, schema, value, receivedType })];
    }
    // get type validation results
    const errors = flattenArray(draft.validateType[receivedType](node, value));
    return errors.filter(errorOrPromise); // ignore promises here
}
