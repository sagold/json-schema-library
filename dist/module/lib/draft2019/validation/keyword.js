import Keywords from "../../draft06/validation/keyword";
import { isObject } from "../../utils/isObject";
import { reduceSchema } from "../../reduceSchema";
import { validateDependentSchemas, validateDependentRequired } from "../../features/dependencies";
/**
 * Get a list of tests to search for a matching pattern to a property
 */
const getPatternTests = (patternProperties) => isObject(patternProperties)
    ? Object.keys(patternProperties).map((pattern) => new RegExp(pattern))
    : [];
/** tests if a property is evaluated by the given schema */
function isPropertyEvaluated(schemaNode, propertyName, value) {
    var _a, _b;
    const node = schemaNode.draft.resolveRef(schemaNode);
    const { schema } = node;
    if (schema.additionalProperties === true) {
        return true;
    }
    // PROPERTIES
    if ((_a = schema.properties) === null || _a === void 0 ? void 0 : _a[propertyName]) {
        const nextSchema = (_b = schema.properties) === null || _b === void 0 ? void 0 : _b[propertyName];
        if (node.draft.isValid(value, nextSchema)) {
            return true;
        }
    }
    // PATTERN-PROPERTIES
    const patterns = getPatternTests(schema.patternProperties);
    if (patterns.find((pattern) => pattern.test(propertyName))) {
        return true;
    }
    // ADDITIONAL-PROPERTIES
    if (isObject(schema.additionalProperties)) {
        const nextSchema = schema.additionalProperties;
        return node.draft.validate(node.next(nextSchema), value);
    }
    return false;
}
const KeywordValidation = {
    // ...omit(Keywords, "dependencies"),
    ...Keywords,
    dependencies: undefined,
    dependentSchemas: validateDependentSchemas,
    dependentRequired: validateDependentRequired,
    /**
     * @draft >= 2019-09
     * Similar to additionalProperties, but can "see" into subschemas and across references
     * https://json-schema.org/draft/2019-09/json-schema-core#rfc.section.9.3.2.4
     */
    unevaluatedProperties: (node, value) => {
        var _a;
        const { draft, schema, pointer } = node;
        // if not in properties, evaluated by additionalProperties and not matches patternProperties
        // @todo we need to know dynamic parent statements - they should not be counted as evaluated...
        if (!isObject(value) || schema.unevaluatedProperties == null) {
            return undefined;
        }
        let unevaluated = Object.keys(value);
        if (unevaluated.length === 0) {
            return undefined;
        }
        // resolve all dynamic schemas
        const reduction = reduceSchema(node, value);
        const resolvedSchema = ((_a = reduction.schema) !== null && _a !== void 0 ? _a : reduction);
        // console.log("unevaluatedProperties", JSON.stringify(resolvedSchema, null, 2), value);
        if (resolvedSchema.unevaluatedProperties === true) {
            return undefined;
        }
        const testPatterns = getPatternTests(resolvedSchema.patternProperties);
        unevaluated = unevaluated.filter((key) => {
            var _a;
            if ((_a = resolvedSchema.properties) === null || _a === void 0 ? void 0 : _a[key]) {
                return false;
            }
            // special case: an evaluation in if statement counts too
            // we have an unevaluated prop only if the if-schema does not match
            if (isObject(schema.if) &&
                isPropertyEvaluated(node.next({ type: "object", ...schema.if }), key, value[key])) {
                return false;
            }
            if (testPatterns.find((pattern) => pattern.test(key))) {
                return false;
            }
            // @todo is this evaluated by additionaProperties per property
            if (resolvedSchema.additionalProperties) {
                return false;
            }
            return true;
        });
        if (unevaluated.length === 0) {
            return undefined;
        }
        const errors = [];
        if (resolvedSchema.unevaluatedProperties === false) {
            unevaluated.forEach((key) => {
                errors.push(draft.errors.unevaluatedPropertyError({
                    pointer: `${pointer}/${key}`,
                    value: JSON.stringify(value[key]),
                    schema
                }));
            });
            return errors;
        }
        unevaluated.forEach((key) => {
            if (isObject(resolvedSchema.unevaluatedProperties)) {
                // note: only key changes
                const keyErrors = draft.validate(node.next(resolvedSchema.unevaluatedProperties, key), value[key]);
                errors.push(...keyErrors);
            }
        });
        return errors;
    },
    /**
     * @draft >= 2019-09
     * Similar to additionalItems, but can "see" into subschemas and across references
     * https://json-schema.org/draft/2019-09/json-schema-core#rfc.section.9.3.1.3
     */
    unevaluatedItems: (node, value) => {
        var _a;
        const { draft, schema, pointer } = node;
        // if not in items, and not matches additionalItems
        if (!Array.isArray(value) ||
            value.length === 0 ||
            schema.unevaluatedItems == null ||
            schema.unevaluatedItems === true) {
            return undefined;
        }
        // resolve all dynamic schemas
        const reduction = reduceSchema(draft.resolveRef(node), value);
        const resolvedSchema = ((_a = reduction.schema) !== null && _a !== void 0 ? _a : reduction);
        // console.log("unevaluatedItems", JSON.stringify(resolvedSchema, null, 2), value);
        if (resolvedSchema.unevaluatedItems === true || resolvedSchema.additionalItems === true) {
            return undefined;
        }
        if (isObject(schema.if)) {
            const nextSchemaNode = { type: "array", ...schema.if };
            if (draft.isValid(value, nextSchemaNode)) {
                if (Array.isArray(nextSchemaNode.items) &&
                    nextSchemaNode.items.length === value.length) {
                    return undefined;
                }
            }
            // need to test remaining items?
        }
        if (isObject(resolvedSchema.items)) {
            const nextSchemaNode = { ...resolvedSchema, unevaluatedItems: undefined };
            const errors = draft.validate(node.next(nextSchemaNode), value);
            return errors.map((e) => draft.errors.unevaluatedItemsError({ ...e.data }));
        }
        if (Array.isArray(resolvedSchema.items)) {
            const items = [];
            for (let i = resolvedSchema.items.length; i < value.length; i += 1) {
                if (i < resolvedSchema.items.length) {
                    if (draft.validate(node.next(resolvedSchema.items[i], i), value[i]).length > 0) {
                        items.push({ index: i, value: value[i] });
                    }
                }
                else {
                    items.push({ index: i, value: value[i] });
                }
            }
            return items.map((item) => draft.errors.unevaluatedItemsError({
                pointer: `${pointer}/${item.index}`,
                value: JSON.stringify(item.value),
                schema: resolvedSchema.unevaluatedItems
            }));
        }
        if (isObject(resolvedSchema.unevaluatedItems)) {
            return value.map((item, index) => {
                if (!draft.isValid(item, resolvedSchema.unevaluatedItems)) {
                    return draft.errors.unevaluatedItemsError({
                        pointer: `${pointer}/${index}`,
                        value: JSON.stringify(item),
                        schema: resolvedSchema.unevaluatedItems
                    });
                }
            });
        }
        const errors = [];
        value.forEach((item, index) => {
            errors.push(draft.errors.unevaluatedItemsError({
                pointer: `${pointer}/${index}`,
                value: JSON.stringify(item),
                schema
            }));
        });
        return errors;
    }
};
export default KeywordValidation;
