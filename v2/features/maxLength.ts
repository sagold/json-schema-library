import ucs2decode from "../../lib/utils/punycode.ucs2decode";
import { Feature, JsonSchemaValidatorParams, SchemaNode } from "../types";

export const maxLengthFeature: Feature = {
    id: "maxLength",
    keyword: "maxLength",
    addValidate: ({ schema }) => !isNaN(schema.maxLength),
    validate: validateMaxLength
};

export function maxLengthValidator(node: SchemaNode): void {
    if (maxLengthFeature.addValidate(node)) {
        node.validators.push(maxLengthFeature.validate);
    }
}

validateMaxLength.toJSON = () => "maxLength";
function validateMaxLength({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
    if (typeof data !== "string") {
        return;
    }
    const { schema } = node;
    const length = ucs2decode(data).length;
    if (schema.maxLength < length) {
        return node.errors.maxLengthError({
            maxLength: schema.maxLength,
            length,
            pointer,
            schema,
            value: data
        });
    }
}
