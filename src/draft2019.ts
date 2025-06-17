import { additionalItemsKeyword } from "./draft2019-09/keywords/additionalItems.js";
import { additionalPropertiesKeyword } from "./keywords/additionalProperties.js";
import { allOfKeyword } from "./keywords/allOf.js";
import { anyOfKeyword } from "./keywords/anyOf.js";
import { constKeyword } from "./keywords/const.js";
import { containsKeyword } from "./keywords/contains.js";
import { $defsKeyword } from "./keywords/$defs.js";
import { dependenciesKeyword } from "./keywords/dependencies.js";
import { dependentRequiredKeyword } from "./keywords/dependentRequired.js";
import { dependentSchemasKeyword } from "./keywords/dependentSchemas.js";
import { enumKeyword } from "./keywords/enum.js";
import { exclusiveMaximumKeyword } from "./keywords/exclusiveMaximum.js";
import { exclusiveMinimumKeyword } from "./keywords/exclusiveMinimum.js";
import { formatKeyword } from "./keywords/format.js";
import { ifKeyword } from "./keywords/ifthenelse.js";
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
import { $refKeyword } from "./draft2019-09/keywords/$ref.js";
import { requiredKeyword } from "./keywords/required.js";
import { sanitizeKeywords } from "./Draft.js";
import { typeKeyword } from "./keywords/type.js";
import { unevaluatedItemsKeyword } from "./draft2019-09/keywords/unevaluatedItems.js";
import { unevaluatedPropertiesKeyword } from "./keywords/unevaluatedProperties.js";
import { uniqueItemsKeyword } from "./keywords/uniqueItems.js";
import { getChildSelection } from "./draft2019-09/methods/getChildSelection.js";
import { getData } from "./draft2019-09/methods/getData.js";
import { toDataNodes } from "./methods/toDataNodes.js";
import { createSchema } from "./methods/createSchema.js";
import { errors } from "./errors/errors.js";
import { formats } from "./formats/formats.js";

/**
 * @draft-2019 https://json-schema.org/draft/2019-09/release-notes
 *
 * new
 * - $anchor
 * - $recursiveAnchor and $recursiveRef
 * - $vocabulary
 *
 * changed
 * - $defs (renamed from definitions)
 * - $id
 * - $ref
 * - dependencies has been split into dependentSchemas and dependentRequired
 */
export const draft2019 = sanitizeKeywords({
    version: "draft-2019-09",
    $schemaRegEx: "draft[/-]2019-09",
    $schema: "https://json-schema.org/draft/2019-09/schema",
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
        dependentRequiredKeyword, // draft-2019: new
        dependentSchemasKeyword, // draft-2019: new
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
        patternPropertiesKeyword,
        patternKeyword,
        propertiesKeyword,
        propertyNamesKeyword,
        requiredKeyword,
        typeKeyword,
        unevaluatedItemsKeyword,
        unevaluatedPropertiesKeyword,
        uniqueItemsKeyword,
        oneOfKeyword,
        additionalItemsKeyword,
        additionalPropertiesKeyword
    ]
});
