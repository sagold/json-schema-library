import { additionalPropertiesKeyword } from "./keywords/additionalProperties.js";
import { allOfKeyword } from "./keywords/allOf.js";
import { anyOfKeyword } from "./keywords/anyOf.js";
import { constKeyword } from "./keywords/const.js";
import { containsKeyword } from "./keywords/contains.js";
import { $defsKeyword } from "./keywords/$defs.js";
import { dependenciesKeyword } from "./keywords/dependencies.js";
import { dependentRequiredKeyword } from "./keywords/dependentRequired.js";
import { dependentSchemasKeyword } from "./keywords/dependentSchemas.js";
import { toDataNodes } from "./methods/toDataNodes.js";
import { enumKeyword } from "./keywords/enum.js";
import { exclusiveMaximumKeyword } from "./keywords/exclusiveMaximum.js";
import { exclusiveMinimumKeyword } from "./keywords/exclusiveMinimum.js";
import { formatKeyword } from "./keywords/format.js";
import { getChildSelection } from "./methods/getChildSelection.js";
import { getData } from "./methods/getData.js";
import { ifKeyword } from "./keywords/ifthenelse.js";
import { itemsKeyword } from "./keywords/items.js";
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
import { prefixItemsKeyword } from "./keywords/prefixItems.js";
import { propertiesKeyword } from "./keywords/properties.js";
import { propertyNamesKeyword } from "./keywords/propertyNames.js";
import { $refKeyword } from "./keywords/$ref.js";
import { requiredKeyword } from "./keywords/required.js";
import { sanitizeKeywords } from "./Draft.js";
import { typeKeyword } from "./keywords/type.js";
import { unevaluatedItemsKeyword } from "./keywords/unevaluatedItems.js";
import { unevaluatedPropertiesKeyword } from "./keywords/unevaluatedProperties.js";
import { uniqueItemsKeyword } from "./keywords/uniqueItems.js";
import { createSchema } from "./methods/createSchema.js";
import { errors } from "./errors/errors.js";
import { formats } from "./formats/formats.js";
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
