import { ValidationAnnotation } from "src/Keyword";
import { SchemaNode } from "src/SchemaNode";

export function collectValidationErrors(errors: ValidationAnnotation[], ...compiled: SchemaNode[]) {
    return compiled.reduce((errors, node) => {
        if (node.schemaValidation) errors.push(...node.schemaValidation);
        return errors;
    }, errors);
}
