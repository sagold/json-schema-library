import { additionalItemsValidator, parseAdditionalItems } from "./features/additionalItems";
import { additionalPropertiesValidator, parseAdditionalProperties } from "./features/additionalProperties";
import { allOfValidator, parseAllOf } from "./features/allOf";
import { anyOfValidator, parseAnyOf } from "./features/anyOf";
import { constValidator } from "./features/const";
import { containsValidator, parseContains } from "./features/contains";
import { dependentRequiredValidator } from "./features/dependentRequired";
import { dependentSchemasValidator, parseDependentSchemas } from "./features/dependentSchemas";
import { enumValidator } from "./features/enum";
import { exclusiveMaximumValidator } from "./features/exclusiveMaximum";
import { exclusiveMinimumValidator } from "./features/exclusiveMinimum";
import { formatValidator } from "./features/format";
import { ifThenElseValidator, parseIfThenElse } from "./features/ifthenelse";
import { itemsValidator, parseItems } from "./features/items";
import { maximumValidator } from "./features/maximum";
import { maxItemsValidator } from "./features/maxItems";
import { maxPropertiesValidator } from "./features/maxProperties";
import { minimumValidator } from "./features/minimum";
import { minItemsValidator } from "./features/minItems";
import { minLengthValidator, maxLengthValidator } from "./features/string";
import { minPropertiesValidator } from "./features/minProperties";
import { multipleOfValidator } from "./features/multipleOf";
import { notValidator, parseNot } from "./features/not";
import { parseDefs } from "./features/defs";
import { parseOneOf, validateOneOf } from "./features/oneOf";
import { parsePatternProperties, patternPropertiesValidator } from "./features/patternProperties";
import { parseProperties, propertiesValidator } from "./features/properties";
import { parseRef, refValidator } from "./features/ref";
import { parseUnevaluatedItems, unevaluatedItemsValidator } from "./features/unevaluatedItems";
import { parseUnevaluatedProperties, unevaluatedPropertiesValidator } from "./features/unevaluatedProperties";
import { patternValidator } from "./features/pattern";
import { propertyNamesValidator } from "./features/propertyNames";
import { requiredValidator } from "./features/required";
import { SchemaNode } from "./types";
import { parseType, typeValidator } from "./features/type";
import { uniqueItemsValidator } from "./features/uniqueItems";
// import { getObjectData } from "./features/object";
// import { getNumberData, getStringData } from "./features/default";
import ERRORS from "../lib/validation/errors";
import { dependenciesValidator, parseDependencies } from "./features/dependencies";

const VERSION = "draft-2019-09";
export { ERRORS, VERSION };

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
