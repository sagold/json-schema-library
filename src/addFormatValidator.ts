import { formatValidators } from "./features/format";
import { JsonSchemaValidator } from "./types";

export function addFormatValidator(formatValue: string, validator: JsonSchemaValidator) {
    formatValidators[formatValue] = validator;
}
