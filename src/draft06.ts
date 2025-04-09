import { additionalItemsKeyword } from "./draft2019-09/keywords/additionalItems";
import { additionalPropertiesKeyword } from "./keywords/additionalProperties";
import { allOfKeyword } from "./keywords/allOf";
import { anyOfKeyword } from "./keywords/anyOf";
import { constKeyword } from "./keywords/const";
import { containsKeyword } from "./keywords/contains";
import { $defsKeyword } from "./keywords/$defs";
import { dependenciesKeyword } from "./keywords/dependencies";
import { enumKeyword } from "./keywords/enum";
import { exclusiveMaximumKeyword } from "./keywords/exclusiveMaximum";
import { exclusiveMinimumKeyword } from "./keywords/exclusiveMinimum";
import { formatKeyword } from "./keywords/format";
import { itemsKeyword } from "./draft2019-09/keywords/items";
import { maximumKeyword } from "./keywords/maximum";
import { maxItemsKeyword } from "./keywords/maxItems";
import { maxLengthKeyword } from "./keywords/maxLength";
import { maxPropertiesKeyword } from "./keywords/maxProperties";
import { minimumKeyword } from "./keywords/minimum";
import { minItemsKeyword } from "./keywords/minItems";
import { minLengthKeyword } from "./keywords/minLength";
import { minPropertiesKeyword } from "./keywords/minProperties";
import { multipleOfKeyword } from "./keywords/multipleOf";
import { notKeyword } from "./keywords/not";
import { oneOfKeyword } from "./keywords/oneOf";
import { patternKeyword } from "./keywords/pattern";
import { patternPropertiesKeyword } from "./keywords/patternProperties";
import { propertiesKeyword } from "./keywords/properties";
import { propertyNamesKeyword } from "./keywords/propertyNames";
import { $refKeyword } from "./draft06/keywords/$ref";
import { requiredKeyword } from "./keywords/required";
import { sanitizeKeywords } from "./Draft";
import { typeKeyword } from "./keywords/type";
import { uniqueItemsKeyword } from "./keywords/uniqueItems";
import { getChildSelection } from "./draft2019-09/methods/getChildSelection";
import { getData } from "./draft2019-09/methods/getData";
import { toDataNodes } from "./methods/toDataNodes";
import { createSchema } from "./methods/createSchema";
import { errors } from "./errors/errors";
import { formats } from "./formats/formats";

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
