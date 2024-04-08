import Keywords from "../../draft06/validation/keyword";
import { isObject } from "../../utils/isObject";
import { reduceSchema } from "../../reduceSchema";
import { validateDependentSchemas, validateDependentRequired } from "../../features/dependencies";
import Q from "../../Q";
/**
 * Get a list of tests to search for a matching pattern to a property
 */
const getPatternTests = (patternProperties) => isObject(patternProperties) ?
    Object.keys(patternProperties).map((pattern) => new RegExp(pattern))
    : [];
/** tests if a property is evaluated by the given schema */
function isPropertyEvaluated(draft, objectSchema, propertyName, value) {
    var _a, _b;
    const schema = draft.resolveRef(objectSchema);
    if (schema.additionalProperties === true) {
        return true;
    }
    // PROPERTIES
    if ((_a = schema.properties) === null || _a === void 0 ? void 0 : _a[propertyName]) {
        const nextSchema = Q.next(objectSchema, (_b = schema.properties) === null || _b === void 0 ? void 0 : _b[propertyName], propertyName);
        if (draft.isValid(value, nextSchema)) {
            return true;
        }
    }
    // PATTERN-PROPERTIES
    const patterns = getPatternTests(schema.patternProperties);
    if (patterns.find(pattern => pattern.test(propertyName))) {
        return true;
    }
    // ADDITIONAL-PROPERTIES
    if (isObject(schema.additionalProperties)) {
        const nextSchema = Q.next(objectSchema, schema.additionalProperties, propertyName);
        return draft.validate(value, nextSchema);
    }
    return false;
}
const KeywordValidation = {
    ...Keywords,
    dependencies: undefined,
    dependentSchemas: validateDependentSchemas,
    dependentRequired: validateDependentRequired,
    /**
     * @draft >= 2019-09
     * Similar to additionalProperties, but can "see" into subschemas and across references
     * https://json-schema.org/draft/2019-09/json-schema-core#rfc.section.9.3.2.4
     */
    unevaluatedProperties: (draft, schema, value, pointer) => {
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
        const resolvedSchema = reduceSchema(draft, schema, value, pointer);
        // console.log("unevaluatedProperties", JSON.stringify(resolvedSchema, null, 2), value);
        if (resolvedSchema.unevaluatedProperties === true) {
            return undefined;
        }
        const testPatterns = getPatternTests(resolvedSchema.patternProperties);
        unevaluated = unevaluated.filter(key => {
            var _a;
            if ((_a = resolvedSchema.properties) === null || _a === void 0 ? void 0 : _a[key]) {
                return false;
            }
            // special case: an evaluation in if statement counts too
            // we have an unevaluated prop only if the if-schema does not match
            if (isObject(schema.if) && isPropertyEvaluated(draft, Q.add(schema, { type: "object", ...schema.if }), key, value[key])) {
                return false;
            }
            if (testPatterns.find(pattern => pattern.test(key))) {
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
            unevaluated.forEach(key => {
                errors.push(draft.errors.unevaluatedPropertyError({
                    pointer: `${pointer}/${key}`,
                    value: JSON.stringify(value[key]),
                    schema
                }));
            });
            return errors;
        }
        unevaluated.forEach(key => {
            const keyErrors = draft.validate(value[key], Q.next(schema, resolvedSchema.unevaluatedProperties, key), `${pointer}/${key}`);
            errors.push(...keyErrors);
        });
        return errors;
    },
    /**
     * @draft >= 2019-09
     * Similar to additionalItems, but can "see" into subschemas and across references
     * https://json-schema.org/draft/2019-09/json-schema-core#rfc.section.9.3.1.3
     */
    unevaluatedItems: (draft, schema, value, pointer) => {
        // if not in items, and not matches additionalItems
        if (!Array.isArray(value) || value.length === 0 || schema.unevaluatedItems == null || schema.unevaluatedItems === true) {
            return undefined;
        }
        // resolve all dynamic schemas
        const resolvedSchema = reduceSchema(draft, draft.resolveRef(schema), value, pointer);
        // console.log("unevaluatedItems", JSON.stringify(resolvedSchema, null, 2), value);
        if (resolvedSchema.unevaluatedItems === true || resolvedSchema.additionalItems === true) {
            return undefined;
        }
        if (isObject(schema.if)) {
            const ifSchema = { type: "array", ...schema.if };
            if (draft.isValid(value, Q.add(schema, ifSchema))) {
                if (Array.isArray(ifSchema.items) && ifSchema.items.length === value.length) {
                    return undefined;
                }
            }
            // need to test remaining items?
        }
        if (isObject(resolvedSchema.items)) {
            const errors = draft.validate(value, Q.add(schema, { ...resolvedSchema, unevaluatedItems: undefined }), pointer);
            return errors.map(e => draft.errors.unevaluatedItemsError({ ...e.data }));
        }
        if (Array.isArray(resolvedSchema.items)) {
            const items = [];
            for (let i = resolvedSchema.items.length; i < value.length; i += 1) {
                if (i < resolvedSchema.items.length) {
                    if (!draft.isValid(value[i], Q.next(schema, resolvedSchema.items[i], i))) {
                        items.push({ index: i, value: value[i] });
                    }
                }
                else {
                    items.push({ index: i, value: value[i] });
                }
            }
            return items.map(item => draft.errors.unevaluatedItemsError({
                pointer: `${pointer}/${item.index}`,
                value: JSON.stringify(item.value),
                schema: resolvedSchema.unevaluatedItems
            }));
        }
        if (isObject(resolvedSchema.unevaluatedItems)) {
            return value.map((item, index) => {
                if (!draft.isValid(item, Q.next(schema, resolvedSchema.unevaluatedItems, index))) {
                    return draft.errors.unevaluatedItemsError({
                        pointer: `${pointer}/${index}`,
                        value: JSON.stringify(item),
                        schema: resolvedSchema.unevaluatedItems
                    });
                }
            });
            // const errors = draft.validate(value, { ...schema, unevaluatedItems: undefined }, pointer);
            // return errors.map(e => draft.errors.unevaluatedItemsError({ ...e.data }));
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
