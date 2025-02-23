import { propertiesValidator } from "../features/properties";
import { SchemaNode } from "./types";
import { minLengthValidator, maxLengthValidator } from "../features/string";
import { maxPropertiesValidator, minPropertiesValidator } from "../features/object";
import { additionalPropertiesValidator } from "../features/additionalProperties";
import { typeValidator } from "../features/type";
import { itemsValidator } from "../features/items";
import { additionalItemsValidator } from "../features/additionalItems";

export const VALIDATORS: ((node: SchemaNode) => void)[] = [
    additionalItemsValidator,
    additionalPropertiesValidator,
    itemsValidator,
    maxLengthValidator,
    maxPropertiesValidator,
    minLengthValidator,
    minPropertiesValidator,
    propertiesValidator,
    typeValidator
].map((func) => {
    // @ts-expect-error extended function for debugging purposes
    func.toJSON = () => func.name;
    return func;
});
