import { propertiesValidator } from "../features/properties";
import { SchemaNode } from "./types";
import { minLengthValidator, maxLengthValidator } from "../features/string";
import { maxPropertiesValidator, minPropertiesValidator } from "../features/object";

export const VALIDATORS: ((node: SchemaNode) => void)[] = [
    maxLengthValidator,
    maxPropertiesValidator,
    minLengthValidator,
    minPropertiesValidator,
    propertiesValidator
].map((func) => {
    // @ts-expect-error extended function for debugging purposes
    func.toJSON = () => func.name;
    return func;
});
