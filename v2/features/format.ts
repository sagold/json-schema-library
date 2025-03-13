import { JsonSchemaValidatorParams, SchemaNode } from "../types";
import formatValidators from "../../lib/validation/format";

export function formatValidator({ schema, validators }: SchemaNode): void {
    if (typeof schema.format !== "string") {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        if (formatValidators[schema.format]) {
            // @ts-expect-error type mismatch
            return formatValidators[schema.format]({ draft: node, data, pointer }, data);
        }
    });
}
