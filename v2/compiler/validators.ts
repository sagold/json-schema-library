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

export const VALIDATORS: ((node: SchemaNode) => void)[] = [
    additionalItemsValidator,
    additionalPropertiesValidator,
    containsValidator,
    itemsValidator,
    maxItemsValidator,
    maxLengthValidator,
    maxPropertiesValidator,
    minItemsValidator,
    minLengthValidator,
    minPropertiesValidator,
    propertiesValidator,
    requiredValidator,
    typeValidator
].map((func) => {
    // @ts-expect-error extended function for debugging purposes
    func.toJSON = () => func.name;
    return func;
});
