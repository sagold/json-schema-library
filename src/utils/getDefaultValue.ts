import { JsonSchema } from "../types";

export function getDefaultValue(schema: JsonSchema, inputData: any, initValue: any) {
    if (inputData != null) {
        return inputData;
    } else if (schema.const) {
        return schema.const;
    } else if (schema.default === undefined && Array.isArray(schema.enum)) {
        return schema.enum[0];
    } else if (schema.default === undefined) {
        return initValue;
    }
    return schema.default;
}
