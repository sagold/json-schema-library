import { propertiesValidator } from "../features/properties";
import { SchemaNode } from "./types";
import { minLengthValidator, maxLengthValidator } from "../features/string";
import { maxPropertiesValidator, minPropertiesValidator } from "../features/object";
import { additionalPropertiesValidator } from "../features/additionalProperties";
import { typeValidator } from "../features/type";
import { itemsValidator } from "../features/items";
import { additionalItemsValidator } from "../features/additionalItems";
import { containsValidator } from "../features/contains";
import { requiredValidator } from "../features/required";
import { validateOneOf } from "../features/oneOf";
import { constValidator } from "../features/const";
import { exclusiveMinimumValidator } from "../features/exclusiveMinimum";
import { patternPropertiesValidator } from "../features/patternProperties";
import { uniqueItemsValidator } from "../features/uniqueItems";
import { enumValidator } from "../features/enum";
import { notValidator } from "../features/not";
import { allOfValidator } from "../features/allOf";
import { ifThenElseValidator } from "../features/ifthenelse";
import { anyOfValidator } from "../features/anyOf";
import { formatValidator } from "../features/format";
import { patternValidator } from "../features/pattern";
import { propertyNamesValidator } from "../features/propertyNames";
import { dependentRequiredValidator } from "../features/dependentRequired";
import { dependentSchemasValidator } from "../features/dependentSchemas";
import { maximumValidator } from "../features/maximum";
import { minimumValidator } from "../features/minimum";
import { multipleOfValidator } from "../features/multipleOf";
import { exclusiveMaximumValidator } from "../features/exclusiveMaximum";
import { maxItemsValidator } from "../features/maxItems";
import { minItemsValidator } from "../features/minItems";

export const VALIDATORS: ((node: SchemaNode) => void)[] = [
    additionalItemsValidator,
    additionalPropertiesValidator,
    allOfValidator,
    anyOfValidator,
    containsValidator,
    constValidator,
    dependentRequiredValidator,
    dependentSchemasValidator,
    enumValidator,
    exclusiveMinimumValidator,
    formatValidator,
    exclusiveMaximumValidator,
    exclusiveMinimumValidator,
    ifThenElseValidator,
    itemsValidator,
    maxItemsValidator,
    maxLengthValidator,
    maxPropertiesValidator,
    minItemsValidator,
    minLengthValidator,
    minPropertiesValidator,
    multipleOfValidator,
    patternValidator,
    propertyNamesValidator,
    propertiesValidator,
    patternPropertiesValidator,
    notValidator,
    minimumValidator,
    maximumValidator,
    requiredValidator,
    validateOneOf,
    typeValidator,
    uniqueItemsValidator
].map((func) => {
    // @ts-expect-error extended function for debugging purposes
    func.toJSON = () => func.name;
    return func;
});
