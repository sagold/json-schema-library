import { Feature, JsonSchemaValidatorParams, JsonError } from "../types";
export declare const formatFeature: Feature;
export declare const formatValidators: Record<string, (options: JsonSchemaValidatorParams) => undefined | JsonError | JsonError[]>;
