import { additionalItemsValidator, parseAdditionalItems } from "./features/additionalItems";
import { additionalPropertiesValidator, parseAdditionalProperties } from "./features/additionalProperties";
import { allOfValidator, parseAllOf } from "./features/allOf";
import { anyOfValidator, parseAnyOf } from "./features/anyOf";
import { enumValidator } from "./features/enum";
import { exclusiveMaximumValidator } from "./features/draft04/exclusiveMaximum";
import { exclusiveMinimumValidator } from "./features/draft04/exclusiveMinimum";
import { formatValidator } from "./features/format";
import { itemsValidator, parseItems } from "./features/items";
import { maximumValidator } from "./features/maximum";
import { maxItemsValidator } from "./features/maxItems";
import { maxPropertiesValidator } from "./features/maxProperties";
import { minimumValidator } from "./features/minimum";
import { minItemsValidator } from "./features/minItems";
import { minLengthValidator, maxLengthValidator } from "./features/string";
import { minPropertiesValidator } from "./features/minProperties";
import { multipleOfValidator } from "./features/multipleOf";
import { notValidator, parseNot } from "./features/not";
import { parseDefs } from "./features/defs";
import { parseOneOf, validateOneOf } from "./features/oneOf";
import { parsePatternProperties, patternPropertiesValidator } from "./features/patternProperties";
import { parseProperties, propertiesValidator } from "./features/properties";
import { parseRef } from "./features/draft04/ref";
import { refValidator } from "./features/draft06/ref";
import { parseUnevaluatedItems, unevaluatedItemsValidator } from "./features/unevaluatedItems";
import { parseUnevaluatedProperties, unevaluatedPropertiesValidator } from "./features/unevaluatedProperties";
import { patternValidator } from "./features/pattern";
import { requiredValidator } from "./features/required";
import { SchemaNode } from "./types";
import { parseType, typeValidator } from "./features/type";
import { uniqueItemsValidator } from "./features/uniqueItems";
import ERRORS from "../lib/validation/errors";
import { dependenciesValidator, parseDependencies } from "./features/dependencies";

const VERSION = "draft-04";
export { ERRORS, VERSION };

/**
 * @draft-04
 *
 * remove from draft06
 * - booleans as schemas allowable anywhere, not just "additionalProperties" and "additionalItems"
 * - propertyNames
 * - contains
 * - const
 * - format: uri-reference
 * - format: uri-template
 * - format: json-pointer
 * - examples: array of examples with no validation effect; the value of "default" is usable as an example without repeating it under this keyword
 *
 * revert from draft06
 * - $id replaces id
 * - $ref only allowed where a schema is expected
 * - "exclusiveMinimum" and exclusiveMaximum changed from a boolean to a number to be consistent with the principle of keyword independence
 * - type integer any number with a zero fractional part; 1.0 is now a valid "integer"  type in draft-06 and later
 * - required  allows an empty array
 * - dependencies allows an empty array for property dependencies
 */

export const PARSER: ((node: SchemaNode) => void)[] = [
    parseRef, // @attention has to come before compiling any other node, @draft-2019: changed
    parseAllOf,
    parseAnyOf,
    parseDefs,
    parseItems,
    parseNot,
    parseOneOf,
    parsePatternProperties,
    parseProperties,
    parseUnevaluatedItems,
    parseUnevaluatedProperties,
    parseDependencies,
    parseAdditionalProperties, // @attention has to come after other object-property parser
    parseAdditionalItems, // @attention has to come after other object-property parser
    parseType
].map((func) => {
    // @ts-expect-error extended function for debugging purposes
    func.toJSON = () => func.name;
    return func;
});

export const VALIDATORS: ((node: SchemaNode) => void)[] = [
    additionalItemsValidator,
    additionalPropertiesValidator,
    allOfValidator,
    anyOfValidator,
    dependenciesValidator,
    enumValidator,
    exclusiveMinimumValidator,
    formatValidator,
    exclusiveMaximumValidator,
    itemsValidator,
    maxItemsValidator,
    maxLengthValidator,
    maxPropertiesValidator,
    minItemsValidator,
    minLengthValidator,
    minPropertiesValidator,
    multipleOfValidator,
    patternValidator,
    propertiesValidator,
    patternPropertiesValidator,
    notValidator,
    minimumValidator,
    maximumValidator,
    requiredValidator,
    validateOneOf,
    typeValidator,
    unevaluatedItemsValidator,
    unevaluatedPropertiesValidator,
    uniqueItemsValidator,
    refValidator
].map((func) => {
    const skipIfRef = (node: SchemaNode) => {
        // @todo find a nicer solution to ignore any keywords on a schenma with a $ref
        if (node.schema?.$ref == null || func.name === "refValidator") {
            func(node);
        }
    };
    skipIfRef.toJSON = () => func.name;
    return skipIfRef;
});
