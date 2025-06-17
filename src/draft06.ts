import { additionalItemsKeyword } from "./draft2019-09/keywords/additionalItems.js";
import { additionalPropertiesKeyword } from "./keywords/additionalProperties.js";
import { allOfKeyword } from "./keywords/allOf.js";
import { anyOfKeyword } from "./keywords/anyOf.js";
import { constKeyword } from "./keywords/const.js";
import { containsKeyword } from "./keywords/contains.js";
import { $defsKeyword } from "./keywords/$defs.js";
import { dependenciesKeyword } from "./keywords/dependencies.js";
import { enumKeyword } from "./keywords/enum.js";
import { exclusiveMaximumKeyword } from "./keywords/exclusiveMaximum.js";
import { exclusiveMinimumKeyword } from "./keywords/exclusiveMinimum.js";
import { formatKeyword } from "./keywords/format.js";
import { itemsKeyword } from "./draft2019-09/keywords/items.js";
import { maximumKeyword } from "./keywords/maximum.js";
import { maxItemsKeyword } from "./keywords/maxItems.js";
import { maxLengthKeyword } from "./keywords/maxLength.js";
import { maxPropertiesKeyword } from "./keywords/maxProperties.js";
import { minimumKeyword } from "./keywords/minimum.js";
import { minItemsKeyword } from "./keywords/minItems.js";
import { minLengthKeyword } from "./keywords/minLength.js";
import { minPropertiesKeyword } from "./keywords/minProperties.js";
import { multipleOfKeyword } from "./keywords/multipleOf.js";
import { notKeyword } from "./keywords/not.js";
import { oneOfKeyword } from "./keywords/oneOf.js";
import { patternKeyword } from "./keywords/pattern.js";
import { patternPropertiesKeyword } from "./keywords/patternProperties.js";
import { propertiesKeyword } from "./keywords/properties.js";
import { propertyNamesKeyword } from "./keywords/propertyNames.js";
import { $refKeyword } from "./draft06/keywords/$ref.js";
import { requiredKeyword } from "./keywords/required.js";
import { sanitizeKeywords } from "./Draft.js";
import { typeKeyword } from "./keywords/type.js";
import { uniqueItemsKeyword } from "./keywords/uniqueItems.js";
import { getChildSelection } from "./draft2019-09/methods/getChildSelection.js";
import { getData } from "./draft2019-09/methods/getData.js";
import { toDataNodes } from "./methods/toDataNodes.js";
import { createSchema } from "./methods/createSchema.js";
import { errors } from "./errors/errors.js";
import { formats } from "./formats/formats.js";

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
export const draft06 = sanitizeKeywords({
    version: "draft-06",
    $schemaRegEx: "draft-06",
    $schema: "http://json-schema.org/draft-06/schema",
    errors,
    formats,
    methods: {
        createSchema,
        getData,
        getChildSelection,
        toDataNodes
    },
    keywords: [
        $refKeyword,
        allOfKeyword,
        anyOfKeyword,
        constKeyword,
        containsKeyword,
        $defsKeyword,
        dependenciesKeyword, // optional support for old draft-version
        enumKeyword,
        exclusiveMaximumKeyword,
        exclusiveMinimumKeyword,
        formatKeyword,
        itemsKeyword,
        maximumKeyword,
        maxItemsKeyword,
        maxLengthKeyword,
        maxPropertiesKeyword,
        minimumKeyword,
        minItemsKeyword,
        minLengthKeyword,
        minPropertiesKeyword,
        multipleOfKeyword,
        notKeyword,
        patternPropertiesKeyword,
        patternKeyword,
        propertiesKeyword,
        propertyNamesKeyword,
        requiredKeyword,
        typeKeyword,
        uniqueItemsKeyword,
        oneOfKeyword,
        additionalItemsKeyword,
        additionalPropertiesKeyword
    ]
});
