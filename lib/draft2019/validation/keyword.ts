import Keywords from "../../draft06/validation/keyword";
import getTypeOf from "../../getTypeOf";
import { JsonValidator, JsonError } from "../../types";
import { isObject } from "../../utils/isObject";
import { reduceSchema } from "../../reduceSchema";
import { validateDependencies } from "../../features/dependencies";

const KeywordValidation: Record<string, JsonValidator> = {
    ...Keywords,
    dependentSchemas: validateDependencies,
    dependentRequired: validateDependencies,
    /**
     * @draft >= 2019-09
     * Similar to additionalProperties, but can "see" into subschemas and across references
     * https://json-schema.org/draft/2019-09/json-schema-core#rfc.section.9.3.2.4
     */
    unevaluatedProperties: (draft, schema, value: Record<string, unknown>, pointer) => {
        // if not in properties, evaluated by additionalProperties and not matches patternProperties
        // @todo we need to know dynamic parent statements - they should not be counted as evaluated...
        if (!isObject(value) || schema.unevaluatedProperties == null) {
            return undefined;
        }
        let properties = Object.keys(value);
        if (properties.length === 0) {
            return undefined;
        }

        // resolve all dynamic schemas
        const resolvedSchema = reduceSchema(draft, schema, value, pointer);

        let patterns: RegExp[];
        if (getTypeOf(resolvedSchema.patternProperties) === "object") {
            patterns = Object.keys(resolvedSchema.patternProperties).map(
                (pattern) => new RegExp(pattern)
            );
        }
        properties = properties.filter(key => {
            if (resolvedSchema.properties?.[key]) {
                return false;
            }
            // special case: an evaluation in if statement counts too
            // @attention - this might miss different configurations
            const ifSchema = schema.if;
            if (isObject(ifSchema?.properties) && ifSchema.properties?.[key]) {
                // we have an unevaluated prop only if the if-schema does not match
                const ifErrors = draft.validate(value, draft.resolveRef(schema.if));
                if (ifErrors.length === 0) {
                    return false;
                }
            }
            if (patterns && patterns.find(pattern => pattern.test(key))) {
                return false;
            }
            // @todo is this evaluated by additionaProperties per property
            if (resolvedSchema.additionalProperties) {
                return false;
            }
            return true;
        });

        if (properties.length === 0) {
            return undefined;
        }

        const errors: JsonError[] = [];
        if (resolvedSchema.unevaluatedProperties === false) {
            properties.forEach(key => {
                errors.push(draft.errors.unevaluatedPropertyError({
                    pointer: `${pointer}/${key}`,
                    value: JSON.stringify(value[key]),
                    schema
                }))
            });
            return errors;
        }

        properties.forEach(key => {
            const keyErrors = draft.validate(value[key], resolvedSchema.unevaluatedProperties, `${pointer}/${key}`);
            errors.push(...keyErrors);
        });
        return errors;
    },
    /**
     * @draft >= 2019-09
     * Similar to additionalItems, but can "see" into subschemas and across references
     * https://json-schema.org/draft/2019-09/json-schema-core#rfc.section.9.3.1.3
     */
    unevaluatedItems: (draft, schema, value: unknown[], pointer) => {
        // if not in items, and not matches additionalItems
        if (!Array.isArray(value) || schema.unevaluatedItems == null) {
            return undefined;
        }

        // resolve all dynamic schemas
        const resolvedSchema = reduceSchema(draft, schema, value, pointer);
        if (resolvedSchema.unevaluatedItems === true || resolvedSchema.additionalItems === true) {
            return undefined;
        }

        if (isObject(resolvedSchema.items)) {
            const errors = draft.validate(value, { ...resolvedSchema, unevaluatedItems: undefined }, pointer);
            return errors.map(e => draft.errors.unevaluatedItemsError({ ...e.data }));
        }

        if (Array.isArray(resolvedSchema.items)) {
            const items: { index: number, value: unknown }[] = [];
            for (let i = resolvedSchema.items.length; i < value.length; i += 1) {
                items.push({ index: i, value: value[i] });
            }
            return items.map(item => draft.errors.unevaluatedItemsError({
                pointer: `${pointer}/${item.index}`,
                value: JSON.stringify(item.value),
                schema: resolvedSchema.unevaluatedItems
            }))
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
            // const errors = draft.validate(value, { ...schema, unevaluatedItems: undefined }, pointer);
            // return errors.map(e => draft.errors.unevaluatedItemsError({ ...e.data }));
        }

        const errors: JsonError[] = [];
        value.forEach((item, index) => {
            errors.push(draft.errors.unevaluatedItemsError({
                pointer: `${pointer}/${index}`,
                value: JSON.stringify(item),
                schema
            }))
        })

        return errors;
    }
};

export default KeywordValidation;
