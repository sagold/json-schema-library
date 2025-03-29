import type { Draft } from "./types";
import { additionalItemsFeature } from "./features/additionalItems";
import { additionalPropertiesFeature } from "./features/additionalProperties";
import { allOfFeature } from "./features/allOf";
import { anyOfFeature } from "./features/anyOf";
import { containsFeature } from "./features/contains";
import { defsFeature } from "./features/defs";
import { dependenciesFeature } from "./features/dependencies";
import { enumFeature } from "./features/enum";
import { exclusiveMaximumFeature } from "./features/draft04/exclusiveMaximum";
import { exclusiveMinimumFeature } from "./features/draft04/exclusiveMinimum";
import { formatFeature } from "./features/format";
import { itemsFeature } from "./features/items";
import { maximumFeature } from "./features/maximum";
import { maxItemsFeature } from "./features/maxItems";
import { maxLengthFeature } from "./features/maxLength";
import { maxPropertiesFeature } from "./features/maxProperties";
import { minimumFeature } from "./features/minimum";
import { minItemsFeature } from "./features/minItems";
import { minLengthFeature } from "./features/minLength";
import { minPropertiesFeature } from "./features/minProperties";
import { multipleOfFeature } from "./features/multipleOf";
import { notFeature } from "./features/not";
import { oneOfFeature } from "./features/oneOf";
import { patternFeature } from "./features/pattern";
import { patternPropertiesFeature } from "./features/patternProperties";
import { propertiesFeature } from "./features/properties";
import { propertyNamesFeature } from "./features/propertyNames";
import { refFeature } from "./features/draft04/ref";
import { requiredFeature } from "./features/required";
import { typeFeature } from "./features/type";
import { uniqueItemsFeature } from "./features/uniqueItems";

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
export const draft04: Draft = {
    version: "draft-04",
    $schemaRegEx: "draft-04",
    $schema: "http://json-schema.org/draft-04/schema",
    features: [
        refFeature,
        allOfFeature,
        anyOfFeature,
        containsFeature,
        defsFeature,
        dependenciesFeature, // optional support for old draft-version
        enumFeature,
        exclusiveMaximumFeature,
        exclusiveMinimumFeature,
        formatFeature,
        itemsFeature,
        maximumFeature,
        maxItemsFeature,
        maxLengthFeature,
        maxPropertiesFeature,
        minimumFeature,
        minItemsFeature,
        minLengthFeature,
        minPropertiesFeature,
        multipleOfFeature,
        notFeature,
        patternPropertiesFeature,
        patternFeature,
        propertiesFeature,
        propertyNamesFeature,
        requiredFeature,
        typeFeature,
        uniqueItemsFeature,
        oneOfFeature,
        additionalItemsFeature,
        additionalPropertiesFeature
    ].map((feature) => {
        const logKeyword = () => feature.keyword;
        if (feature.validate) {
            feature.validate.toJSON = logKeyword;
        }
        if (feature.reduce) {
            feature.reduce.toJSON = logKeyword;
        }
        if (feature.resolve) {
            feature.resolve.toJSON = logKeyword;
        }
        return feature;
    })
};
