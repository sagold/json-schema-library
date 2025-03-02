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

export const VALIDATORS: ((node: SchemaNode) => void)[] = [
    additionalItemsValidator,
    additionalPropertiesValidator,
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
