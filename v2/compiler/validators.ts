import { propertiesValidator } from "../features/properties";
import { SchemaNode } from "./types";
import { minLengthValidator, maxLengthValidator } from "../features/string";
import { maxPropertiesValidator, minPropertiesValidator } from "../features/object";
import { additionalPropertiesValidator } from "../features/additionalProperties";
import { typeValidator } from "../features/type";
import { itemsValidator } from "../features/items";

export const VALIDATORS: ((node: SchemaNode) => void)[] = [
    additionalPropertiesValidator,
    maxLengthValidator,
    maxPropertiesValidator,
    minLengthValidator,
    minPropertiesValidator,
    propertiesValidator,
    itemsValidator,
    typeValidator
].map((func) => {
    // @ts-expect-error extended function for debugging purposes
    func.toJSON = () => func.name;
    return func;
});
