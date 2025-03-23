import { Feature, JsonSchemaValidatorParams } from "../types";
import formatValidators from "../../lib/validation/format";

export const formatFeature: Feature = {
    id: "format",
    keyword: "format",
    addValidate: ({ schema }) => formatValidators[schema?.format] != null,
    validate: validateFormat
};

function validateFormat({ node, data, pointer }: JsonSchemaValidatorParams) {
    // @ts-expect-error type mismatch
    return formatValidators[node.schema.format]({ draft: node, data, pointer }, data);
}
