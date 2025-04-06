import { formatValidators } from "./keywords/format";
import { JsonSchemaValidator } from "./Keyword";

export function addFormatValidator(formatValue: string, validator: JsonSchemaValidator) {
    formatValidators[formatValue] = validator;
}
