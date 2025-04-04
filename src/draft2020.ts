import { additionalItemsFeature } from "./features/additionalItems";
import { additionalPropertiesFeature } from "./features/additionalProperties";
import { allOfFeature } from "./features/allOf";
import { anyOfFeature } from "./features/anyOf";
import { constFeature } from "./features/const";
import { containsFeature } from "./features/contains";
import { defsFeature } from "./features/defs";
import { dependenciesFeature } from "./features/dependencies";
import { dependentRequiredFeature } from "./features/dependentRequired";
import { dependentSchemasFeature } from "./features/dependentSchemas";
import { enumFeature } from "./features/enum";
import { errors } from "./errors/errors";
import { exclusiveMaximumFeature } from "./features/exclusiveMaximum";
import { exclusiveMinimumFeature } from "./features/exclusiveMinimum";
import { formatFeature } from "./features/format";
import { getChildSchemaSelection } from "./getChildSchemaSelection";
import { getTemplate } from "./getTemplate";
import { ifFeature } from "./features/ifthenelse";
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
import { prefixItemsFeature } from "./features/prefixItems";
import { propertiesFeature } from "./features/properties";
import { propertyNamesFeature } from "./features/propertyNames";
import { refFeature } from "./features/ref";
import { requiredFeature } from "./features/required";
import { sanitizeFeatures } from "./utils/sanitizeFeatures";
import { typeFeature } from "./features/type";
import { unevaluatedItemsFeature } from "./features/unevaluatedItems";
import { unevaluatedPropertiesFeature } from "./features/unevaluatedProperties";
import { uniqueItemsFeature } from "./features/uniqueItems";
import { each } from "./each";

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
export const draft2020 = sanitizeFeatures({
    version: "draft-2020-12",
    $schemaRegEx: "draft[/-]2020-12",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    errors,
    methods: {
        getTemplate,
        getChildSchemaSelection,
        each
    },
    features: [
        refFeature,
        additionalItemsFeature,
        additionalPropertiesFeature,
        allOfFeature,
        anyOfFeature,
        constFeature,
        containsFeature,
        defsFeature,
        dependenciesFeature,
        dependentRequiredFeature,
        dependentSchemasFeature,
        enumFeature,
        exclusiveMaximumFeature,
        exclusiveMinimumFeature,
        formatFeature,
        ifFeature,
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
        oneOfFeature,
        patternFeature,
        patternPropertiesFeature,
        prefixItemsFeature,
        propertiesFeature,
        propertyNamesFeature,
        requiredFeature,
        typeFeature,
        unevaluatedItemsFeature,
        unevaluatedPropertiesFeature,
        uniqueItemsFeature
    ]
});
