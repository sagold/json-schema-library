import { additionalItemsFeature } from "./features/additionalItems";
import { additionalPropertiesFeature } from "./features/additionalProperties";
import { allOfFeature } from "./features/allOf";
import { anyOfFeature } from "./features/anyOf";
import { constFeature } from "./features/const";
import { containsFeature } from "./features/contains";
import { defsFeature } from "./features/defs";
import { dependenciesFeature } from "./features/dependencies";
import { enumFeature } from "./features/enum";
import { errors } from "./errors/errors";
import { exclusiveMaximumFeature } from "./features/exclusiveMaximum";
import { exclusiveMinimumFeature } from "./features/exclusiveMinimum";
import { formatFeature } from "./features/format";
import { itemsFeature } from "./draft2019-09/features/items";
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
import { refFeature } from "./draft06/features/ref";
import { requiredFeature } from "./features/required";
import { sanitizeFeatures } from "./utils/sanitizeFeatures";
import { typeFeature } from "./features/type";
import { unevaluatedItemsFeature } from "./features/unevaluatedItems";
import { unevaluatedPropertiesFeature } from "./features/unevaluatedProperties";
import { uniqueItemsFeature } from "./features/uniqueItems";
import { getChildSchemaSelection } from "./getChildSchemaSelection";
import { getTemplate } from "./draft2019-09/getTemplate";

/**
 * @draft-06 https://json-schema.org/draft-06/json-schema-release-notes
 *
 * new
 * - booleans as schemas allowable anywhere, not just "additionalProperties" and "additionalItems"
 * - propertyNames
 * - contains
 * - const
 * - format: uri-reference
 * - format: uri-template
 * - format: json-pointer
 * - examples: array of examples with no validation effect; the value of "default" is usable as an example without repeating it under this keyword
 *
 * changes
 * - $id replaces id
 * - $ref only allowed where a schema is expected
 * - "exclusiveMinimum" and exclusiveMaximum changed from a boolean to a number to be consistent with the principle of keyword independence
 * - type integer any number with a zero fractional part; 1.0 is now a valid "integer"  type in draft-06 and later
 * - required  allows an empty array
 * - dependencies allows an empty array for property dependencies
 */
export const draft06 = sanitizeFeatures({
    version: "draft-06",
    $schemaRegEx: "draft-06",
    $schema: "http://json-schema.org/draft-06/schema",
    errors,
    methods: {
        getTemplate,
        getChildSchemaSelection
    },
    features: [
        refFeature,
        allOfFeature,
        anyOfFeature,
        constFeature,
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
        unevaluatedItemsFeature,
        unevaluatedPropertiesFeature,
        uniqueItemsFeature,
        oneOfFeature,
        additionalItemsFeature,
        additionalPropertiesFeature
    ]
});
