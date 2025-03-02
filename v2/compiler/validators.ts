import { propertiesValidator } from "../features/properties";
import { SchemaNode } from "./types";
import { minLengthValidator, maxLengthValidator } from "../features/string";
import { maxPropertiesValidator, minPropertiesValidator } from "../features/object";
import { additionalPropertiesValidator } from "../features/additionalProperties";
import { typeValidator } from "../features/type";
import { itemsValidator } from "../features/items";
import { additionalItemsValidator } from "../features/additionalItems";
import { maxItemsValidator, minItemsValidator } from "../features/array";
import { containsValidator } from "../features/contains";
import { requiredValidator } from "../features/required";
import { validateOneOf } from "../features/oneOf";
import { constValidator } from "../features/const";
import { maximumValidator, minimumValidator, multipleOfValidator } from "../features/number";
import { patternPropertiesValidator } from "../features/patternProperties";
import { uniqueItemsValidator } from "../features/uniqueItems";
import { enumValidator } from "../features/enum";
import { notValidator } from "../features/not";
import { allOfValidator } from "../features/allOf";

export const VALIDATORS: ((node: SchemaNode) => void)[] = [
    additionalItemsValidator,
    additionalPropertiesValidator,
    allOfValidator,
    containsValidator,
    constValidator,
    enumValidator,
    itemsValidator,
    maxItemsValidator,
    maxLengthValidator,
    maxPropertiesValidator,
    minItemsValidator,
    minLengthValidator,
    minPropertiesValidator,
    multipleOfValidator,
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
