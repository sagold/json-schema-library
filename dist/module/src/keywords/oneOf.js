import { isSchemaNode } from "../types";
import settings from "../settings";
import { getValue } from "../utils/getValue";
import sanitizeErrors from "../utils/sanitizeErrors";
import { isObject } from "../utils/isObject";
import { validateNode } from "../validateNode";
import { joinDynamicId } from "../SchemaNode";
const { DECLARATOR_ONEOF } = settings;
export const oneOfKeyword = {
    id: "oneOf",
    keyword: "oneOf",
    parse: parseOneOf,
    addReduce: (node) => node.oneOf != null,
    reduce: reduceOneOf,
    addValidate: (node) => node.oneOf != null,
    validate: oneOfValidator
};
export const oneOfFuzzyKeyword = {
    id: "oneOf-fuzzy",
    keyword: "oneOf",
    parse: parseOneOf,
    addReduce: (node) => node.oneOf != null,
    reduce: reduceOneOfFuzzy,
    addValidate: (node) => node.oneOf != null,
    validate: oneOfValidator
};
export function parseOneOf(node) {
    const { schema, spointer, schemaId } = node;
    if (Array.isArray(schema.oneOf) && schema.oneOf.length) {
        node.oneOf = schema.oneOf.map((s, index) => node.compileSchema(s, `${spointer}/oneOf/${index}`, `${schemaId}/oneOf/${index}`));
    }
}
function reduceOneOf({ node, data, pointer, path }) {
    var _a, _b;
    // !keyword: oneOfProperty
    // an additional <DECLARATOR_ONEOF> (default `oneOfProperty`) on the schema will exactly determine the
    // oneOf value (if set in data)
    if (data != null && node.schema[DECLARATOR_ONEOF]) {
        return reduceOneOfDeclarator({ node, data, pointer, path });
    }
    const matches = [];
    const errors = [];
    for (let i = 0; i < node.oneOf.length; i += 1) {
        const validationErrors = validateNode(node.oneOf[i], data, pointer, path);
        if (validationErrors.length === 0) {
            matches.push({ index: i, node: node.oneOf[i] });
        }
        else {
            errors.push(...validationErrors);
        }
    }
    if (matches.length === 1) {
        const { node, index } = matches[0];
        const { node: reducedNode, error } = node.reduceSchema(data, { pointer, path });
        if (reducedNode) {
            const nestedDynamicId = (_b = (_a = reducedNode.dynamicId) === null || _a === void 0 ? void 0 : _a.replace(node.dynamicId, "")) !== null && _b !== void 0 ? _b : "";
            const dynamicId = nestedDynamicId === "" ? `oneOf/${index}` : nestedDynamicId;
            reducedNode.oneOfIndex = index; // @evaluation-info
            reducedNode.dynamicId = joinDynamicId(reducedNode.dynamicId, `+${node.schemaId}(${dynamicId})`);
            return reducedNode;
        }
        return error;
    }
    if (matches.length === 0) {
        return node.createError("one-of-error", {
            value: JSON.stringify(data),
            pointer,
            schema: node.schema,
            oneOf: node.schema.oneOf,
            errors
        });
    }
    return node.createError("one-of-error", {
        value: JSON.stringify(data),
        pointer,
        schema: node.schema,
        oneOf: node.schema.oneOf,
        errors
    });
}
export function reduceOneOfDeclarator({ node, data, pointer, path }) {
    const errors = [];
    const oneOfProperty = node.schema[DECLARATOR_ONEOF];
    const oneOfValue = getValue(data, oneOfProperty);
    if (oneOfValue === undefined) {
        return node.createError("missing-one-of-property-error", {
            property: oneOfProperty,
            pointer,
            schema: node.schema,
            value: data
        });
    }
    for (let i = 0; i < node.oneOf.length; i += 1) {
        const { node: resultNode } = node.oneOf[i].getChild(oneOfProperty, data);
        if (!isSchemaNode(resultNode)) {
            return node.createError("missing-one-of-declarator-error", {
                declarator: DECLARATOR_ONEOF,
                oneOfProperty,
                schemaPointer: node.oneOf[i].schemaId,
                pointer,
                schema: node.schema,
                value: data
            });
        }
        const result = sanitizeErrors(validateNode(resultNode, oneOfValue, pointer, path));
        // result = result.filter(errorOrPromise);
        if (result.length > 0) {
            errors.push(...result);
        }
        else {
            const { node: reducedNode } = node.oneOf[i].reduceSchema(data, { pointer, path });
            if (reducedNode) {
                reducedNode.oneOfIndex = i; // @evaluation-info
                return reducedNode;
            }
        }
    }
    return node.createError("one-of-property-error", {
        property: oneOfProperty,
        value: oneOfValue,
        pointer,
        schema: node.schema,
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
function fuzzyObjectValue(node, data, pointer, path) {
    var _a;
    if (data == null || node.properties == null) {
        return -1;
    }
    let value = 0;
    const keys = Object.keys((_a = node.properties) !== null && _a !== void 0 ? _a : {});
    for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (data[key]) {
            if (validateNode(node.properties[key], data[key], pointer, path).length === 0) {
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
export function reduceOneOfFuzzy({ node, data, pointer, path }) {
    // @todo: usingMergeNode may add reducers that are no longer available
    if (node.oneOf == null) {
        return node;
    }
    const oneOfResult = reduceOneOf({ node, data, pointer, path });
    if (isSchemaNode(oneOfResult)) {
        return oneOfResult;
    }
    // fuzzy match oneOf
    if (isObject(data)) {
        let nodeOfItem;
        let schemaOfIndex = -1;
        let fuzzyGreatest = 0;
        for (let i = 0; i < node.oneOf.length; i += 1) {
            const oneNode = node.oneOf[i];
            const fuzzyValue = fuzzyObjectValue(oneNode, data, pointer, path);
            if (fuzzyGreatest < fuzzyValue) {
                fuzzyGreatest = fuzzyValue;
                nodeOfItem = oneNode;
                schemaOfIndex = i;
            }
        }
        if (nodeOfItem === undefined) {
            return node.createError("one-of-error", {
                value: JSON.stringify(data),
                pointer,
                schema: node.schema,
                oneOf: node.schema.oneOf
            });
        }
        const { node: reducedNode, error } = nodeOfItem.reduceSchema(data, { pointer, path });
        if (reducedNode) {
            reducedNode.oneOfIndex = schemaOfIndex; // @evaluation-info
            return reducedNode;
        }
        return error;
    }
    return oneOfResult;
}
function oneOfValidator({ node, data, pointer = "#", path }) {
    const { oneOf, schema } = node;
    if (!oneOf) {
        return;
    }
    const matches = [];
    const errors = [];
    for (let i = 0; i < oneOf.length; i += 1) {
        const validationResult = validateNode(oneOf[i], data, pointer, path);
        if (validationResult.length > 0) {
            errors.push(...validationResult);
        }
        else {
            matches.push({ index: i, node: oneOf[i] });
        }
    }
    if (matches.length === 1) {
        const { node, index } = matches[0];
        node.oneOfIndex = index; // @evaluation-info
        return undefined;
    }
    if (matches.length > 1) {
        return node.createError("multiple-one-of-error", {
            value: data,
            pointer,
            schema,
            matches
        });
    }
    return node.createError("one-of-error", {
        value: JSON.stringify(data),
        pointer,
        schema,
        oneOf: schema.oneOf,
        errors
    });
}
