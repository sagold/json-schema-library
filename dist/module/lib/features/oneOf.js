/**
 * @draft-04
 */
import flattenArray from "../utils/flattenArray";
import settings from "../config/settings";
import { errorOrPromise } from "../utils/filter";
import { isJsonError } from "../types";
import { isObject } from "../utils/isObject";
const { DECLARATOR_ONEOF, EXPOSE_ONE_OF_INDEX } = settings;
function setOneOfOrigin(schema, index) {
    if (EXPOSE_ONE_OF_INDEX && isObject(schema)) {
        schema.__oneOfIndex = index;
    }
}
/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param draft - validator
 * @param data
 * @param schema - current json schema containing property oneOf
 * @param pointer - json pointer to data
 * @return oneOf schema or an error
 */
export function resolveOneOf(node, data) {
    const { schema, draft, pointer } = node;
    // !keyword: oneOfProperty
    // an additional <DECLARATOR_ONEOF> (default `oneOfProperty`) on the schema will exactly determine the
    // oneOf value (if set in data)
    // @fixme
    // abort if no data is given an DECLARATOR_ONEOF is set (used by getChildSchemaSelection)
    // this case (data != null) should not be necessary
    if (data != null && schema[DECLARATOR_ONEOF]) {
        const errors = [];
        const oneOfProperty = schema[DECLARATOR_ONEOF];
        const oneOfValue = data[schema[DECLARATOR_ONEOF]];
        if (oneOfValue === undefined) {
            return draft.errors.missingOneOfPropertyError({
                property: oneOfProperty,
                pointer,
                schema,
                value: data
            });
        }
        for (let i = 0; i < schema.oneOf.length; i += 1) {
            const oneNode = node.next(schema.oneOf[i]).resolveRef();
            const resultNode = draft.step(oneNode, oneOfProperty, data);
            if (isJsonError(resultNode)) {
                return resultNode;
            }
            let result = flattenArray(draft.validate(resultNode, oneOfValue));
            result = result.filter(errorOrPromise);
            if (result.length > 0) {
                errors.push(...result);
            }
            else {
                // @evaluation-info
                setOneOfOrigin(oneNode.schema, i);
                return resultNode.next(oneNode.schema);
            }
        }
        return draft.errors.oneOfPropertyError({
            property: oneOfProperty,
            value: oneOfValue,
            pointer,
            schema,
            errors
        });
    }
    const matches = [];
    const errors = [];
    for (let i = 0; i < schema.oneOf.length; i += 1) {
        const oneNode = draft.resolveRef(node.next(schema.oneOf[i]));
        let result = flattenArray(draft.validate(oneNode, data));
        result = result.filter(errorOrPromise);
        if (result.length > 0) {
            errors.push(...result);
        }
        else {
            matches.push({ index: i, schema: oneNode.schema });
        }
    }
    if (matches.length === 1) {
        // @evaluation-info
        setOneOfOrigin(matches[0].schema, matches[0].index);
        return node.next(matches[0].schema);
    }
    if (matches.length > 1) {
        return draft.errors.multipleOneOfError({
            value: data,
            pointer,
            schema,
            matches
        });
    }
    return draft.errors.oneOfError({
        value: JSON.stringify(data),
        pointer,
        schema,
        oneOf: schema.oneOf,
        errors
    });
}
/**
 * Returns a ranking for the data and given schema
 *
 * @param draft
 * @param - json schema type: object
 * @param data
 * @param [pointer]
 * @return ranking value (higher is better)
 */
function fuzzyObjectValue(node, data) {
    const { draft, schema, pointer } = node;
    if (data == null || schema.properties == null) {
        return -1;
    }
    let value = 0;
    const keys = Object.keys(schema.properties);
    for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (data[key]) {
            if (draft.isValid(data[key], schema.properties[key], pointer)) {
                value += 1;
            }
        }
    }
    return value;
}
/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param draft
 * @param data
 * @param [schema] - current json schema containing property oneOf
 * @param [pointer] - json pointer to data
 * @return oneOf schema or an error
 */
export function resolveOneOfFuzzy(node, data) {
    const { schema, pointer, draft } = node;
    if (!Array.isArray(schema.oneOf)) {
        throw new Error("not a oneof schema");
        return node;
    }
    // !keyword: oneOfProperty
    // an additional <DECLARATOR_ONEOF> (default `oneOfProperty`) on the schema will exactly determine the
    // oneOf value (if set in data)
    // @fixme
    // abort if no data is given an DECLARATOR_ONEOF is set (used by getChildSchemaSelection)
    // this case (data != null) should not be necessary
    if (data != null && schema[DECLARATOR_ONEOF]) {
        const errors = [];
        const oneOfProperty = schema[DECLARATOR_ONEOF];
        const oneOfValue = data[schema[DECLARATOR_ONEOF]];
        if (oneOfValue === undefined) {
            return draft.errors.missingOneOfPropertyError({
                property: oneOfProperty,
                pointer,
                schema,
                value: data
            });
        }
        for (let i = 0; i < schema.oneOf.length; i += 1) {
            const oneNode = draft.resolveRef(node.next(schema.oneOf[i]));
            const resultNode = draft.step(oneNode, oneOfProperty, data);
            if (isJsonError(resultNode)) {
                return resultNode;
            }
            let result = flattenArray(draft.validate(resultNode, oneOfValue));
            result = result.filter(errorOrPromise);
            if (result.length > 0) {
                errors.push(...result);
            }
            else {
                // @evaluation-info
                setOneOfOrigin(oneNode.schema, i);
                return resultNode.next(oneNode.schema);
            }
        }
        return draft.errors.oneOfPropertyError({
            property: oneOfProperty,
            value: oneOfValue,
            pointer,
            schema,
            errors
        });
    }
    // keyword: oneOf
    const matches = [];
    for (let i = 0; i < schema.oneOf.length; i += 1) {
        const oneNode = draft.resolveRef(node.next(schema.oneOf[i]));
        const one = oneNode.schema;
        if (draft.isValid(data, one, pointer)) {
            matches.push({ schema: one, index: i });
        }
    }
    if (matches.length === 1) {
        // @evaluation-info
        setOneOfOrigin(matches[0].schema, matches[0].index);
        return node.next(matches[0].schema);
    }
    // fuzzy match oneOf
    if (isObject(data)) {
        let schemaOfItem;
        let schemaOfIndex = -1;
        let fuzzyGreatest = 0;
        for (let i = 0; i < schema.oneOf.length; i += 1) {
            const oneNode = draft.resolveRef(node.next(schema.oneOf[i]));
            const fuzzyValue = fuzzyObjectValue(oneNode, data);
            if (fuzzyGreatest < fuzzyValue) {
                fuzzyGreatest = fuzzyValue;
                schemaOfItem = oneNode.schema;
                schemaOfIndex = i;
            }
        }
        if (schemaOfItem === undefined) {
            return draft.errors.oneOfError({
                value: JSON.stringify(data),
                pointer,
                schema,
                oneOf: schema.oneOf
            });
        }
        // @evaluation-info
        setOneOfOrigin(schemaOfItem, schemaOfIndex);
        return node.next(schemaOfItem);
    }
    if (matches.length > 1) {
        return draft.errors.multipleOneOfError({ matches, pointer, schema, value: data });
    }
    return draft.errors.oneOfError({
        value: JSON.stringify(data),
        pointer,
        schema,
        oneOf: schema.oneOf
    });
}
/**
 * validates oneOf definition for given input data
 */
const validateOneOf = (node, value) => {
    if (Array.isArray(node.schema.oneOf)) {
        const nodeOrError = node.draft.resolveOneOf(node, value);
        if (isJsonError(nodeOrError)) {
            return nodeOrError;
        }
    }
};
export { validateOneOf };
