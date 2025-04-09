import { additionalItemsKeyword } from "./draft2019-09/keywords/additionalItems";
import { additionalPropertiesKeyword } from "./keywords/additionalProperties";
import { allOfKeyword } from "./keywords/allOf";
import { anyOfKeyword } from "./keywords/anyOf";
import { constKeyword } from "./keywords/const";
import { containsKeyword } from "./keywords/contains";
import { $defsKeyword } from "./keywords/$defs";
import { dependenciesKeyword } from "./keywords/dependencies";
import { dependentRequiredKeyword } from "./keywords/dependentRequired";
import { dependentSchemasKeyword } from "./keywords/dependentSchemas";
import { enumKeyword } from "./keywords/enum";
import { exclusiveMaximumKeyword } from "./keywords/exclusiveMaximum";
import { exclusiveMinimumKeyword } from "./keywords/exclusiveMinimum";
import { formatKeyword } from "./keywords/format";
import { ifKeyword } from "./keywords/ifthenelse";
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
import { $refKeyword } from "./draft2019-09/keywords/$ref";
import { requiredKeyword } from "./keywords/required";
import { sanitizeKeywords } from "./Draft";
import { typeKeyword } from "./keywords/type";
import { unevaluatedItemsKeyword } from "./draft2019-09/keywords/unevaluatedItems";
import { unevaluatedPropertiesKeyword } from "./keywords/unevaluatedProperties";
import { uniqueItemsKeyword } from "./keywords/uniqueItems";
import { getChildSelection } from "./draft2019-09/methods/getChildSelection";
import { getData } from "./draft2019-09/methods/getData";
import { toDataNodes } from "./methods/toDataNodes";
import { createSchema } from "./methods/createSchema";
import { errors } from "./errors/errors";
import { formats } from "./formats/formats";

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
