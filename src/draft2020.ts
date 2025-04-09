import { additionalPropertiesKeyword } from "./keywords/additionalProperties";
import { allOfKeyword } from "./keywords/allOf";
import { anyOfKeyword } from "./keywords/anyOf";
import { constKeyword } from "./keywords/const";
import { containsKeyword } from "./keywords/contains";
import { $defsKeyword } from "./keywords/$defs";
import { dependenciesKeyword } from "./keywords/dependencies";
import { dependentRequiredKeyword } from "./keywords/dependentRequired";
import { dependentSchemasKeyword } from "./keywords/dependentSchemas";
import { toDataNodes } from "./methods/toDataNodes";
import { enumKeyword } from "./keywords/enum";
import { exclusiveMaximumKeyword } from "./keywords/exclusiveMaximum";
import { exclusiveMinimumKeyword } from "./keywords/exclusiveMinimum";
import { formatKeyword } from "./keywords/format";
import { getChildSelection } from "./methods/getChildSelection";
import { getData } from "./methods/getData";
import { ifKeyword } from "./keywords/ifthenelse";
import { itemsKeyword } from "./keywords/items";
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
import { prefixItemsKeyword } from "./keywords/prefixItems";
import { propertiesKeyword } from "./keywords/properties";
import { propertyNamesKeyword } from "./keywords/propertyNames";
import { $refKeyword } from "./keywords/$ref";
import { requiredKeyword } from "./keywords/required";
import { sanitizeKeywords } from "./Draft";
import { typeKeyword } from "./keywords/type";
import { unevaluatedItemsKeyword } from "./keywords/unevaluatedItems";
import { unevaluatedPropertiesKeyword } from "./keywords/unevaluatedProperties";
import { uniqueItemsKeyword } from "./keywords/uniqueItems";
import { createSchema } from "./methods/createSchema";
import { errors } from "./errors/errors";
import { formats } from "./formats/formats";

/**
 * @draft-2020-12 https://json-schema.org/draft/2020-12/release-notes
 *
 * - The items and additionalItems keywords have been replaced with prefixItems and items
 * - Although the meaning of items has changed, the syntax for defining arrays remains the same.
 *  Only the syntax for defining tuples has changed. The idea is that an array has items (items)
 *  and optionally has some positionally defined items that come before the normal items (prefixItems).
 * - The $recursiveRef and $recursiveAnchor keywords were replaced by the more powerful $dynamicRef and
 *  $dynamicAnchor keywords
 * - This draft specifies that any item in an array that passes validation of the contains schema is
 *  considered "evaluated".
 * - Regular expressions are now expected (but not strictly required) to support unicode characters.
 * - This draft drops support for the schema media type parameter
 * - If you reference an external schema, that schema can declare its own $schema and that may be different
 *  than the $schema of the referencing schema. Implementations need to be prepared to switch processing
 *  modes or throw an error if they don't support the $schema of the referenced schema
 * - Implementations that collect annotations should now include annotations for unknown keywords in the
 *  "verbose" output format.
 * - The format vocabulary was broken into two separate vocabularies. The "format-annotation" vocabulary
 *  treats the format keyword as an annotation and the "format-assertion" vocabulary treats the format
 *  keyword as an assertion. The "format-annotation" vocabulary is used in the default meta-schema and
 *  is required.
 *
 */
export const draft2020 = sanitizeKeywords({
    version: "draft-2020-12",
    $schemaRegEx: "draft[/-]2020-12",
    $schema: "https://json-schema.org/draft/2020-12/schema",
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
        additionalPropertiesKeyword,
        allOfKeyword,
        anyOfKeyword,
        constKeyword,
        containsKeyword,
        $defsKeyword,
        dependenciesKeyword,
        dependentRequiredKeyword,
        dependentSchemasKeyword,
        enumKeyword,
        exclusiveMaximumKeyword,
        exclusiveMinimumKeyword,
        formatKeyword,
        ifKeyword,
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
        oneOfKeyword,
        patternKeyword,
        patternPropertiesKeyword,
        prefixItemsKeyword,
        propertiesKeyword,
        propertyNamesKeyword,
        requiredKeyword,
        typeKeyword,
        unevaluatedItemsKeyword,
        unevaluatedPropertiesKeyword,
        uniqueItemsKeyword
    ]
});
