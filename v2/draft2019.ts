import { additionalItemsFeature, additionalItemsValidator, parseAdditionalItems } from "./features/additionalItems";
import {
    additionalPropertiesFeature,
    additionalPropertiesValidator,
    parseAdditionalProperties
} from "./features/additionalProperties";
import { allOfFeature, allOfValidator, parseAllOf } from "./features/allOf";
import { anyOfFeature, anyOfValidator, parseAnyOf } from "./features/anyOf";
import { constFeature, constValidator } from "./features/const";
import { containsFeature, containsValidator, parseContains } from "./features/contains";
import { dependentRequiredFeature, dependentRequiredValidator } from "./features/dependentRequired";
import { dependentSchemasFeature, dependentSchemasValidator, parseDependentSchemas } from "./features/dependentSchemas";
import { enumFeature, enumValidator } from "./features/enum";
import { exclusiveMaximumFeature, exclusiveMaximumValidator } from "./features/exclusiveMaximum";
import { exclusiveMinimumFeature, exclusiveMinimumValidator } from "./features/exclusiveMinimum";
import { formatFeature, formatValidator } from "./features/format";
import { ifFeature, ifThenElseValidator, parseIfThenElse } from "./features/ifthenelse";
import { itemsFeature, itemsValidator, parseItems } from "./features/items";
import { maximumFeature, maximumValidator } from "./features/maximum";
import { maxItemsFeature, maxItemsValidator } from "./features/maxItems";
import { maxPropertiesFeature, maxPropertiesValidator } from "./features/maxProperties";
import { minimumFeature, minimumValidator } from "./features/minimum";
import { minItemsFeature, minItemsValidator } from "./features/minItems";
import { minPropertiesFeature, minPropertiesValidator } from "./features/minProperties";
import { multipleOfFeature, multipleOfValidator } from "./features/multipleOf";
import { notFeature, notValidator, parseNot } from "./features/not";
import { parseDefs } from "./features/defs";
import { oneOfFeature, parseOneOf, validateOneOf } from "./features/oneOf";
import {
    parsePatternProperties,
    patternPropertiesFeature,
    patternPropertiesValidator
} from "./features/patternProperties";
import { parseProperties, propertiesFeature, propertiesValidator } from "./features/properties";
import { parseRef, refFeature, refValidator } from "./features/ref";
import { parseUnevaluatedItems, unevaluatedItemsFeature, unevaluatedItemsValidator } from "./features/unevaluatedItems";
import {
    parseUnevaluatedProperties,
    unevaluatedPropertiesFeature,
    unevaluatedPropertiesValidator
} from "./features/unevaluatedProperties";
import { patternFeature, patternValidator } from "./features/pattern";
import { parsePropertyNames, propertyNamesFeature, propertyNamesValidator } from "./features/propertyNames";
import { requiredFeature, requiredValidator } from "./features/required";
import { Feature, SchemaNode } from "./types";
import { parseType, typeFeature, typeValidator } from "./features/type";
import { uniqueItemsFeature, uniqueItemsValidator } from "./features/uniqueItems";
import ERRORS from "../lib/validation/errors";
import { dependenciesFeature, dependenciesValidator, parseDependencies } from "./features/dependencies";
import { maxLengthFeature, maxLengthValidator } from "./features/maxLength";
import { minLengthFeature, minLengthValidator } from "./features/minLength";

const VERSION = "draft-2019-09";
export { ERRORS, VERSION };

export const FEATURES: Feature[] = [
    refFeature,
    allOfFeature,
    anyOfFeature,
    constFeature,
    containsFeature,
    dependenciesFeature, // optional support for old draft-version
    dependentRequiredFeature, // draft-2019: new
    dependentSchemasFeature, // draft-2019: new
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
];

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

export const PARSER: ((node: SchemaNode) => void)[] = [
    parseRef, // @attention has to come before compiling any other node, @draft-2019: changed
    parseAllOf,
    parseAnyOf,
    parseContains,
    parseDefs,
    parseDependencies,
    parseDependentSchemas, // @draft-2019: new
    parseIfThenElse,
    parseItems,
    parseNot,
    parseOneOf,
    parsePatternProperties,
    parseProperties,
    parsePropertyNames,
    parseType,
    parseUnevaluatedItems,
    parseUnevaluatedProperties,
    parseAdditionalItems, // @attention has to come after other object-property parser
    parseAdditionalProperties // @attention has to come after other object-property parser
].map((func) => {
    // @ts-expect-error extended function for debugging purposes
    func.toJSON = () => func.name;
    return func;
});

export const VALIDATORS: ((node: SchemaNode) => void)[] = [
    allOfValidator,
    anyOfValidator,
    constValidator,
    containsValidator,
    dependenciesValidator, // optional support for old draft-version
    dependentRequiredValidator, // draft-2019: new
    dependentSchemasValidator, // draft-2019: new
    enumValidator,
    exclusiveMaximumValidator,
    exclusiveMinimumValidator,
    formatValidator,
    ifThenElseValidator,
    itemsValidator,
    maximumValidator,
    maxItemsValidator,
    maxLengthValidator,
    maxPropertiesValidator,
    minimumValidator,
    minItemsValidator,
    minLengthValidator,
    minPropertiesValidator,
    multipleOfValidator,
    notValidator,
    patternPropertiesValidator,
    patternValidator,
    propertiesValidator,
    propertyNamesValidator,
    refValidator,
    requiredValidator,
    typeValidator,
    unevaluatedItemsValidator,
    unevaluatedPropertiesValidator,
    uniqueItemsValidator,
    validateOneOf,
    additionalItemsValidator,
    additionalPropertiesValidator
].map((func) => {
    // @ts-expect-error extended function for debugging purposes
    func.toJSON = () => func.name;
    return func;
});
