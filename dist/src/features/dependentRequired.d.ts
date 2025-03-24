import { JsonError, Feature, JsonSchemaValidatorParams } from "../types";
export declare const dependentRequiredFeature: Feature;
export declare function validateDependentRequired({ node, data, pointer }: JsonSchemaValidatorParams): JsonError[];
