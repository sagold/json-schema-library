import { formatValidators } from "./keywords/format";
export function addFormatValidator(formatValue, validator) {
    formatValidators[formatValue] = validator;
}
