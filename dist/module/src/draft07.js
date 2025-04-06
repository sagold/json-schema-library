import { additionalItemsKeyword } from "./keywords/additionalItems";
import { additionalPropertiesKeyword } from "./keywords/additionalProperties";
import { allOfKeyword } from "./keywords/allOf";
import { anyOfKeyword } from "./keywords/anyOf";
import { constKeyword } from "./keywords/const";
import { containsKeyword } from "./keywords/contains";
import { defsKeyword } from "./keywords/defs";
import { dependenciesKeyword } from "./keywords/dependencies";
import { enumKeyword } from "./keywords/enum";
import { errors } from "./errors/errors";
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
import { refKeyword } from "./draft06/keywords/ref";
import { requiredKeyword } from "./keywords/required";
import { sanitizeKeywords } from "./utils/sanitizeKeywords";
import { typeKeyword } from "./keywords/type";
import { uniqueItemsKeyword } from "./keywords/uniqueItems";
import { getChildSchemaSelection } from "./draft2019-09/methods/getChildSchemaSelection";
import { getTemplate } from "./draft2019-09/methods/getTemplate";
import { each } from "./draft2019-09/methods/each";
import { createSchema } from "./methods/createSchema";
/**
 * @draft-07 https://json-schema.org/draft-07/json-schema-release-notes
 *
 * new
 * - "$comment"
 * - "if", "then", "else"
 * - "readOnly"
 * - "writeOnly"
 * - "contentMediaType"
 * - "contentEncoding"
 */
export const draft07 = sanitizeKeywords({
    version: "draft-07",
    $schemaRegEx: "draft-07",
    $schema: "http://json-schema.org/draft-07/schema",
    errors,
    methods: {
        createSchema,
        getTemplate,
        getChildSchemaSelection,
        each
    },
    keywords: [
        refKeyword,
        allOfKeyword,
        anyOfKeyword,
        constKeyword,
        containsKeyword,
        defsKeyword,
        dependenciesKeyword, // optional support for old draft-version
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
        uniqueItemsKeyword,
        oneOfKeyword,
        additionalItemsKeyword,
        additionalPropertiesKeyword
    ]
});
